-- ================================================================
-- MIGRATION: Order Status Management (Buyer-Seller Workflow)
-- Chạy file này trong SQL Editor của Supabase
-- ================================================================

-- 1. Mở rộng CHECK constraint cho phép thêm các trạng thái giao hàng
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY[
    'pending'::text,    -- Đang chờ người bán xác nhận
    'confirmed'::text,  -- Người bán đã xác nhận
    'shipping'::text,   -- Đang giao hàng
    'delivered'::text,  -- Đã giao tới tay người mua
    'completed'::text,  -- Hoàn tất (VNPAY đã thanh toán)
    'failed'::text,     -- Thanh toán VNPAY thất bại
    'cancelled'::text   -- Đã hủy
  ]));

-- 2. Thêm cột ghi chú người bán và timestamp cập nhật trạng thái
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS seller_note text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamp with time zone DEFAULT now();

-- 3. Cập nhật RLS: Người BÁN có thể UPDATE status đơn có hàng của mình
--    (Bổ sung thêm policy, policy cho user_id đã có từ rls-all-fix.sql)
DROP POLICY IF EXISTS "Sellers can update order status for their items" ON public.orders;
CREATE POLICY "Sellers can update order status for their items" ON public.orders
  FOR UPDATE USING (
    items @> jsonb_build_array(jsonb_build_object('owner_id', auth.uid()::text))
  );

-- 4. Function để tạo notification khi order status thay đổi
CREATE OR REPLACE FUNCTION notify_order_status_change(
  target_user_id UUID,         -- ID người nhận thông báo (người mua hoặc người bán)
  order_id UUID,               -- ID đơn hàng liên quan
  new_status TEXT,             -- Trạng thái mới
  actor_name TEXT DEFAULT 'Hệ thống'
)
RETURNS VOID AS $$
DECLARE
  title_msg TEXT;
  body_msg TEXT;
BEGIN
  CASE new_status
    WHEN 'confirmed' THEN
      title_msg := '✅ Đơn hàng đã được xác nhận';
      body_msg := 'Người bán đã xác nhận đơn hàng của bạn và đang chuẩn bị hàng.';
    WHEN 'shipping' THEN
      title_msg := '🚚 Đơn hàng đang được giao';
      body_msg := 'Đơn hàng của bạn đang trên đường giao đến địa chỉ bạn đã cung cấp.';
    WHEN 'delivered' THEN
      title_msg := '📦 Đơn hàng đã được giao';
      body_msg := 'Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua sắm!';
    WHEN 'cancelled' THEN
      title_msg := '❌ Đơn hàng đã bị hủy';
      body_msg := 'Đơn hàng của bạn đã bị hủy. Vui lòng liên hệ người bán để biết thêm chi tiết.';
    ELSE
      title_msg := '🔔 Cập nhật đơn hàng';
      body_msg := 'Trạng thái đơn hàng của bạn đã được cập nhật.';
  END CASE;

  INSERT INTO public.notifications (
    receiver_id, type, title, message, related_entity_id, action_url, is_read
  ) VALUES (
    target_user_id,
    'order_status',
    title_msg,
    body_msg,
    order_id,
    '/my-store',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: Tự động gửi notification mỗi khi status đơn hàng thay đổi
CREATE OR REPLACE FUNCTION on_order_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  -- Chỉ chạy khi status thực sự thay đổi
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Ghi lại thời điểm thay đổi
    NEW.status_updated_at = now();

    -- Gửi thông báo cho NGƯỜI MUA khi người bán cập nhật
    IF NEW.status IN ('confirmed', 'shipping', 'delivered', 'cancelled') THEN
      PERFORM notify_order_status_change(NEW.user_id, NEW.id, NEW.status);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS order_status_change_trigger ON public.orders;
CREATE TRIGGER order_status_change_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION on_order_status_changed();
