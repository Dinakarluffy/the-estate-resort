"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  User,
  ShieldCheck,
  Coffee,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  AlertTriangle,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "GUEST" | "STAFF" | "GM";
  phone: string | null;
  createdAt: string;
}

interface UserManagerProps {
  currentAdminId: string;
}

export function UserManager({ currentAdminId }: UserManagerProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // In-app custom confirmation modal state
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load user accounts" });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "GUEST" | "STAFF" | "GM") => {
    setUpdatingId(userId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error || "Failed to update role" });
      } else {
        setMessage({
          type: "success",
          text: `Role successfully updated to ${newRole} for ${data.user.name}`,
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update role" });
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const { id: userId, name: userName } = userToDelete;

    setDeletingId(userId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error || "Failed to delete user" });
      } else {
        setMessage({ type: "success", text: `Account for ${userName} deleted successfully` });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to delete user" });
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white border border-[#ebded2] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Staff & User Role Administration</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            General Manager control: View all accounts, promote guests to staff, or delegate GM permissions
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users or roles..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#546a4a]"
          />
        </div>
      </div>

      {/* Peer Protection Banner */}
      <div className="p-3 sm:p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Executive Peer Protection:</strong> You can promote staff members to General Manager. However, once an account is a General Manager, it is protected from being demoted or deleted by fellow GMs (requires Resort Owner authorization).
        </span>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
          <span>Loading accounts...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-8 text-center text-xs text-stone-500">
          No matching user accounts found.
        </div>
      ) : (
        <>
          {/* Mobile Card View (shown on screens < md) */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.map((u) => {
              const isCurrentAdmin = u.id === currentAdminId;
              const isFellowGm = u.role === "GM" && !isCurrentAdmin;
              const isUpdating = updatingId === u.id;
              const isDeleting = deletingId === u.id;

              return (
                <div
                  key={u.id}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-stone-50/80 transition space-y-3 text-xs"
                >
                  {/* Card Header: Name + Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-stone-900 text-sm flex items-center gap-1.5 flex-wrap">
                        <span>{u.name}</span>
                        {isCurrentAdmin ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                            You (Active GM)
                          </span>
                        ) : isFellowGm ? (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium border border-stone-200">
                            <Lock className="w-2.5 h-2.5 text-stone-500" /> Peer GM
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono mt-0.5 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    </div>

                    {/* Role Pill */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        u.role === "GM"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : u.role === "STAFF"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-stone-100 text-stone-700 border border-stone-200"
                      }`}
                    >
                      {u.role === "GM" ? (
                        <ShieldCheck className="w-3 h-3 text-amber-700" />
                      ) : u.role === "STAFF" ? (
                        <Coffee className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <User className="w-3 h-3 text-stone-500" />
                      )}
                      <span>{u.role}</span>
                    </span>
                  </div>

                  {/* Card Meta: Contact & Joined */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/60 text-[11px] text-stone-500">
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span className="font-mono">{u.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-400">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2.5 border-t border-stone-200/60">
                    {isCurrentAdmin ? (
                      <div className="text-[11px] text-stone-400 italic text-center py-1">
                        Protected (Your Account)
                      </div>
                    ) : isFellowGm ? (
                      <div className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Protected (Peer GM — Resort Owner Authorization)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* Role Select Dropdown */}
                        <div className="flex-1">
                          <select
                            disabled={isUpdating || isDeleting}
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value as "GUEST" | "STAFF" | "GM")
                            }
                            className="w-full text-xs bg-white border border-stone-300 rounded-lg px-2 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#546a4a] disabled:opacity-50"
                          >
                            <option value="GUEST">GUEST</option>
                            <option value="STAFF">STAFF</option>
                            <option value="GM">GM</option>
                          </select>
                        </div>

                        {/* Quick 1-Click Promote */}
                        {u.role === "GUEST" ? (
                          <button
                            type="button"
                            disabled={isUpdating || isDeleting}
                            onClick={() => handleRoleChange(u.id, "STAFF")}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition disabled:opacity-50 shrink-0"
                          >
                            Promote to Staff
                          </button>
                        ) : u.role === "STAFF" ? (
                          <button
                            type="button"
                            disabled={isUpdating || isDeleting}
                            onClick={() => handleRoleChange(u.id, "GM")}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold transition disabled:opacity-50 shrink-0"
                          >
                            Promote to GM
                          </button>
                        ) : null}

                        {/* Delete Button */}
                        <button
                          type="button"
                          title="Delete User Account"
                          disabled={isUpdating || isDeleting}
                          onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-stone-200 transition disabled:opacity-50 shrink-0"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table (shown on screens >= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Current Role</th>
                  <th className="py-2.5 px-3 text-right">Role Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = u.id === currentAdminId;
                  const isFellowGm = u.role === "GM" && !isCurrentAdmin;
                  const isUpdating = updatingId === u.id;
                  const isDeleting = deletingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrentAdmin ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                              You (Active GM)
                            </span>
                          ) : isFellowGm ? (
                            <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Peer GM
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                          {u.email}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                        <div className="font-mono">{u.phone || "—"}</div>
                        <div className="text-[10px] text-stone-400">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            u.role === "GM"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : u.role === "STAFF"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : "bg-stone-100 text-stone-700 border border-stone-200"
                          }`}
                        >
                          {u.role === "GM" ? (
                            <ShieldCheck className="w-3 h-3 text-amber-700" />
                          ) : u.role === "STAFF" ? (
                            <Coffee className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <User className="w-3 h-3 text-stone-500" />
                          )}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {isCurrentAdmin ? (
                          <span className="text-[11px] text-stone-400 italic">
                            Protected (Your Account)
                          </span>
                        ) : isFellowGm ? (
                          <span className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap">
                            <Lock className="w-3 h-3 text-amber-600" /> Protected (Peer GM)
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-2 whitespace-nowrap">
                            {/* Role Select Dropdown */}
                            <select
                              disabled={isUpdating || isDeleting}
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value as "GUEST" | "STAFF" | "GM")
                              }
                              className="text-xs bg-white border border-stone-300 rounded px-2 py-1 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#546a4a] disabled:opacity-50"
                            >
                              <option value="GUEST">GUEST</option>
                              <option value="STAFF">STAFF</option>
                              <option value="GM">GM</option>
                            </select>

                            {/* Quick 1-Click Promote / Demote */}
                            {u.role === "GUEST" ? (
                              <button
                                type="button"
                                disabled={isUpdating || isDeleting}
                                onClick={() => handleRoleChange(u.id, "STAFF")}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-semibold transition disabled:opacity-50"
                              >
                                Promote to Staff
                              </button>
                            ) : u.role === "STAFF" ? (
                              <button
                                type="button"
                                disabled={isUpdating || isDeleting}
                                onClick={() => handleRoleChange(u.id, "GM")}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px] font-semibold transition disabled:opacity-50"
                              >
                                Promote to GM
                              </button>
                            ) : null}

                            {/* In-App Delete Button (Triggers modern custom modal) */}
                            <button
                              type="button"
                              title="Delete User Account"
                              disabled={isUpdating || isDeleting}
                              onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                              className="p-1 text-stone-400 hover:text-red-600 rounded transition disabled:opacity-50"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modern In-App Confirmation Modal (Teleported to document.body) */}
      {mounted && userToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-stone-900">
              Delete User Account?
            </h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Are you sure you want to permanently delete the account for <strong className="text-stone-900">{userToDelete.name}</strong>? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {deletingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{deletingId ? "Deleting..." : "Delete Account"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
