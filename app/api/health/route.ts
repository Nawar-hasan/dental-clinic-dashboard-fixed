import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(){try{await prisma.$queryRaw`SELECT 1`;return NextResponse.json({ok:true,service:"ammar-darwish-dental-clinic",database:"connected"})}catch{return NextResponse.json({ok:false,database:"disconnected"},{status:503})}}
