import { NextRequest, NextResponse } from "next/server";
import { CertificateService } from "@/lib/certificate-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { gameCode: string } }
) {
  try {
    const status = await CertificateService.getCertificateStatus(
      params.gameCode
    );
    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to fetch certificate status:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificate status" },
      { status: 500 }
    );
  }
}
