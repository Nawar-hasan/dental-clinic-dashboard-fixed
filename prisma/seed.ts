import "dotenv/config";
import { Gender, AppointmentStatus, PaymentMethod, VisitStatus } from "../app/generated/prisma/client";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
async function main(){
  const email=process.env.ADMIN_EMAIL||"admin@clinic.local"; const password=process.env.ADMIN_PASSWORD||"ChangeMe123!";
  const admin=await prisma.user.upsert({where:{email},update:{},create:{email,name:"مدير العيادة",passwordHash:await bcrypt.hash(password,12),role:"ADMIN"}});
  await prisma.clinicSettings.upsert({where:{id:"clinic"},update:{},create:{id:"clinic",clinicName:"عيادة الدكتور عمار درويش",doctorName:"الدكتور عمار درويش",currency:"SYP",workingHours:"السبت - الخميس، 09:00 - 18:00"}});
  for(const name of ["إيجار العيادة","رواتب الموظفين","مواد طبية","أدوات أسنان","مختبر الأسنان","تعقيم","صيانة الأجهزة","كهرباء","ماء","إنترنت","تسويق وإعلانات","مصروفات إدارية","مصروفات أخرى"]){await prisma.expenseCategory.upsert({where:{name},update:{},create:{name}})}
  if(await prisma.patient.count()===0){
    const data=[
      ["P-0001","ليان","أحمد","الحسن","ليان أحمد الحسن",Gender.FEMALE,"0991000001"],
      ["P-0002","سامر","محمود","درويش","سامر محمود درويش",Gender.MALE,"0991000002"],
      ["P-0003","نور","خالد","العلي","نور خالد العلي",Gender.FEMALE,"0991000003"],
      ["P-0004","رامي","حسن","يوسف","رامي حسن يوسف",Gender.MALE,"0991000004"],
      ["P-0005","مريم","فواز","سليمان","مريم فواز سليمان",Gender.FEMALE,"0991000005"]
    ] as const;
    for(let i=0;i<data.length;i++){
      const [fileNumber,firstName,fatherName,lastName,fullName,gender,phone]=data[i];
      const patient=await prisma.patient.create({data:{fileNumber,firstName,fatherName,lastName,fullName,gender,phone,medicalHistory:{create:{bloodType:i%2===0?"O+":"A+",allergies:i===2?"حساسية من البنسلين":null}}}});
      const visit=await prisma.visit.create({data:{patientId:patient.id,sessionNumber:1,date:new Date(Date.now()-i*7*86400000),type:i%2===0?"حشوة تجميلية":"تنظيف أسنان",diagnosis:"تشخيص تجريبي",procedure:"إجراء علاجي تجريبي",status:VisitStatus.COMPLETED,costCents:(50+i*25)*100}});
      await prisma.payment.create({data:{patientId:patient.id,visitId:visit.id,receiptNumber:`REC-${String(i+1).padStart(5,"0")}`,amountCents:(25+i*10)*100,method:i%2===0?PaymentMethod.CASH:PaymentMethod.CARD,receiver:"مدير العيادة"}});
      await prisma.appointment.create({data:{patientId:patient.id,startAt:new Date(Date.now()+(i+1)*86400000),endAt:new Date(Date.now()+(i+1)*86400000+30*60000),type:"متابعة علاج",status:i%2===0?AppointmentStatus.CONFIRMED:AppointmentStatus.PENDING}});
    }
  }
  await prisma.activityLog.create({data:{userId:admin.id,action:"SEED",description:"تجهيز البيانات الأولية."}}); console.log(`Seed completed. Admin: ${email}`);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>prisma.$disconnect());
