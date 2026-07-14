import Link from "next/link";
export default function NotFound(){return <div className="card" style={{maxWidth:600,margin:"60px auto",textAlign:"center"}}><h1>الصفحة غير موجودة</h1><p style={{color:"#64748b"}}>قد يكون السجل محذوفًا أو مؤرشفًا.</p><Link className="btn btn-primary" href="/">العودة إلى لوحة التحكم</Link></div>}
