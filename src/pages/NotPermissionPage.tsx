import { Button, Result, Typography } from "antd";

export default function NotPermissionPage() {
    return (
        <Result
            status="403"
            title="403"
            subTitle="Bạn không có quyền truy cập trang này"
        // extra={<Button type="primary" onClick={() => window.location.href = '/'}>Quay về trang chủ</Button>}
        />
    );
}