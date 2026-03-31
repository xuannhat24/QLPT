import express from 'express';
import cors from 'cors';
import { VNPay, ProductCode, VnpLocale } from 'vnpay';

const app = express();
const port = 3001;

// Khai báo middleware để server hiểu dữ liệu JSON từ React và cho phép cross-origin
app.use(cors());
app.use(express.json());

// Khởi tạo vnpay object
const vnpay = new VNPay({
    tmnCode: 'AA8VR5HP',
    secureSecret: 'N33G16ZT70IWUJXIRORIZL4OUWNGWG1A',
    vnpayHost: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    testMode: true,
    hashAlgorithm: 'SHA512',
    enableLog: true, 
});

app.post('/create-payment-url', (req, res) => {
    const { amount, orderId, orderInfo } = req.body;

    const paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: amount || 10000, 
        vnp_IpAddr: '127.0.0.1',
        vnp_TxnRef: orderId || `${Date.now()}`,
        vnp_OrderInfo: orderInfo || 'Thanh toán đơn hàng',   
        vnp_OrderType: ProductCode.Other, 
        vnp_ReturnUrl: 'http://localhost:3000/payment-result',
        vnp_Locale: VnpLocale.VN,
    });

    return res.status(200).json({ url: paymentUrl });
});

app.listen(port, () => {
    console.log(`Server VNPay đang chạy tại http://localhost:${port}`);
});