import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import {
  updateEnquiryDraft,
  approveAndSendEnquiry,
  rerouteEnquiry,
  archiveEnquiry,
  updateEnquiryNotes,
  updateEnquiryPhone,
  checkDuplicateEnquiries,
} from "@/lib/enquiry";

async function verifyStaffOrGm() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  if (!token) return null;
  const user = await verifySessionToken(token);
  if (!user || (user.role !== "STAFF" && user.role !== "GM")) return null;
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyStaffOrGm();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Staff or GM credentials required." }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const { action, draftReply, category, assignedRole, archiveState, internalNotes, guestPhone } = body;

    if (action === "updateDraft") {
      if (!draftReply) {
        return NextResponse.json({ error: "Missing draftReply" }, { status: 400 });
      }
      const updated = await updateEnquiryDraft(id, draftReply);
      return NextResponse.json({ success: true, enquiry: updated });
    }

    if (action === "approveAndSend") {
      if (guestPhone) {
        await updateEnquiryPhone(id, guestPhone);
      }
      const updated = await approveAndSendEnquiry(id, draftReply);
      return NextResponse.json({ success: true, enquiry: updated });
    }

    if (action === "updatePhone") {
      if (!guestPhone || !guestPhone.trim()) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
      }
      const updated = await updateEnquiryPhone(id, guestPhone);
      return NextResponse.json({ success: true, enquiry: updated });
    }

    if (action === "reroute") {
      if (!category) {
        return NextResponse.json({ error: "Missing category for reroute" }, { status: 400 });
      }
      const updated = await rerouteEnquiry(id, category, assignedRole);
      return NextResponse.json({ success: true, enquiry: updated });
    }

    if (action === "archive") {
      const updated = await archiveEnquiry(id, archiveState ?? true);
      return NextResponse.json({ success: true, enquiry: updated });
    }

    if (action === "updateNotes") {
      const updated = await updateEnquiryNotes(id, internalNotes || "");
      return NextResponse.json({ success: true, enquiry: updated });
    }

    return NextResponse.json({ error: "Invalid action. Supported: updateDraft, approveAndSend, reroute, archive, updateNotes" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
