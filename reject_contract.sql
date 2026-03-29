-- Chạy đoạn mã RPC này trong SQL Editor của Supabase để hỗ trợ tính năng Từ chối hợp đồng cho Tenant.

CREATE OR REPLACE FUNCTION reject_contract(p_contract_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contract record;
  v_room_title text;
BEGIN
  -- 1. Tìm thông tin hợp đồng đang chờ (chỉ thao tác trên pending contract)
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id AND status = 'pending';

  IF v_contract IS NULL THEN
    RAISE EXCEPTION 'Pending contract not found';
  END IF;

  -- 2. Đổi trạng thái hợp đồng thành bị từ chối
  UPDATE public.contracts 
  SET status = 'rejected'
  WHERE id = p_contract_id;

  -- 3. Cập nhật trạng thái phòng trả về trạng thái trống (empty)
  UPDATE public.rooms
  SET status = 'empty'
  WHERE id = v_contract.room_id
  RETURNING title INTO v_room_title;

  -- 4. Thông báo cho chủ trọ qua bảng notifications
  INSERT INTO public.notifications (
    sender_id,
    receiver_id,
    type,
    title,
    message,
    related_entity_id,
    action_url
  ) VALUES (
    v_contract.tenant_id,
    v_contract.owner_id,
    'contract_rejected',
    'Hợp đồng bị từ chối',
    'Người thuê đã từ chối lời mời ký hợp đồng cho phòng "' || COALESCE(v_room_title, 'N/A') || '". Mời bạn kiểm tra lại.',
    p_contract_id,
    'manage?tab=contracts'
  );

  RETURN TRUE;
END;
$$;
