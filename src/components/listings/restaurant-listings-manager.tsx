"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ManagedListing } from "@/lib/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";

type StatusFilter = "all" | "active" | "paused" | "archived";

type EditDraft = {
  title: string;
  description: string;
  discountedPriceCents: number;
  quantityTotal: number;
  quantityRemaining: number;
  allergyNotes: string;
};

const primaryLinkClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 h-9 px-3 text-sm";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusTone(status: ManagedListing["status"]) {
  if (status === "paused") return "bg-amber-100 text-amber-800";
  if (status === "archived") return "bg-neutral-200 text-neutral-700";
  return "bg-emerald-100 text-emerald-800";
}

export function RestaurantListingsManager() {
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, EditDraft>>({});
  const [isMutating, setIsMutating] = useState(false);
  const [hasLoadedSuccess, setHasLoadedSuccess] = useState(false);

  async function loadListings() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/listings", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        listings?: ManagedListing[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load listings");
      }
      setListings(Array.isArray(payload.listings) ? payload.listings : []);
      setHasLoadedSuccess(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load listings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadListings();
  }, []);

  const stats = useMemo(() => {
    let active = 0;
    let paused = 0;
    let archived = 0;
    let soldOut = 0;

    for (const listing of listings) {
      if (listing.status === "active") active += 1;
      if (listing.status === "paused") paused += 1;
      if (listing.status === "archived") archived += 1;
      if (listing.quantityRemaining <= 0) soldOut += 1;
    }

    return { total: listings.length, active, paused, archived, soldOut };
  }, [listings]);

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (statusFilter !== "all" && listing.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      const haystack =
        `${listing.title} ${listing.description} ${listing.restaurantName}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [listings, query, statusFilter]);

  function createEditDraft(listing: ManagedListing): EditDraft {
    return {
      title: listing.title,
      description: listing.description,
      discountedPriceCents: listing.priceCents,
      quantityTotal: listing.quantityTotal,
      quantityRemaining: listing.quantityRemaining,
      allergyNotes: listing.allergyNotes ?? "",
    };
  }

  function beginEdit(listing: ManagedListing) {
    const nextDrafts = { ...editDrafts };
    if (activeEditId && editDraft) {
      nextDrafts[activeEditId] = editDraft;
    }
    const nextDraft = nextDrafts[listing.id] ?? createEditDraft(listing);
    setEditDrafts(nextDrafts);
    setActiveEditId(listing.id);
    setEditDraft(nextDraft);
  }

  async function runMutation(
    listingId: string,
    options: { method: "PATCH" | "DELETE"; body?: Record<string, unknown> },
  ): Promise<boolean> {
    setIsMutating(true);
    setError(null);
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: options.method,
        headers: { "Content-Type": "application/json" },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        listing?: ManagedListing;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Listing update failed");
      }

      if (options.method === "DELETE") {
        setListings((current) => current.filter((listing) => listing.id !== listingId));
      } else if (payload.listing) {
        setListings((current) =>
          current.map((listing) => (listing.id === listingId ? payload.listing! : listing)),
        );
      } else {
        await loadListings();
      }
      return true;
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Listing update failed");
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function saveEdit() {
    if (!activeEditId || !editDraft) return;
    if (
      !Number.isFinite(editDraft.discountedPriceCents) ||
      !Number.isFinite(editDraft.quantityTotal) ||
      !Number.isFinite(editDraft.quantityRemaining) ||
      editDraft.discountedPriceCents < 0 ||
      editDraft.quantityTotal < 1 ||
      editDraft.quantityRemaining < 0 ||
      editDraft.quantityRemaining > editDraft.quantityTotal
    ) {
      setError("Please enter valid price and inventory values.");
      return;
    }
    const didSave = await runMutation(activeEditId, { method: "PATCH", body: editDraft });
    if (didSave) {
      setEditDrafts((current) => {
        const next = { ...current };
        delete next[activeEditId];
        return next;
      });
      setActiveEditId(null);
      setEditDraft(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 border-brand-100 bg-gradient-to-br from-brand-50 to-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-title-md">Restaurant listings hub</h2>
            <p className="text-sm text-neutral-600">
              Manage inventory in real-time with quick pause, archive, edit, and delete actions.
            </p>
          </div>
          <Link href="/listings/new" className={primaryLinkClasses}>
            Create listing
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="space-y-0.5 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Total</p>
            <p className="text-xl font-semibold text-neutral-900">{stats.total}</p>
          </Card>
          <Card className="space-y-0.5 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Active</p>
            <p className="text-xl font-semibold text-emerald-700">{stats.active}</p>
          </Card>
          <Card className="space-y-0.5 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Paused</p>
            <p className="text-xl font-semibold text-amber-700">{stats.paused}</p>
          </Card>
          <Card className="space-y-0.5 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Archived</p>
            <p className="text-xl font-semibold text-neutral-700">{stats.archived}</p>
          </Card>
          <Card className="space-y-0.5 p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Sold out</p>
            <p className="text-xl font-semibold text-rose-700">{stats.soldOut}</p>
          </Card>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Search listings"
            placeholder="Search by title, description, restaurant..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label htmlFor="status-filter-select" className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-neutral-800">Status filter</span>
            <select
              id="status-filter-select"
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
      </Card>

      {error ? <ErrorState message={error} /> : null}

      {isLoading ? (
        <Card role="status" aria-busy="true" className="space-y-1">
          <p className="text-sm text-neutral-600">Loading listings manager...</p>
        </Card>
      ) : !error && hasLoadedSuccess && filteredListings.length === 0 ? (
        <EmptyState
          title="No listings found"
          description="Try changing filters or create a fresh listing for tonight."
          action={
            <Link href="/listings/new" className={primaryLinkClasses}>
              Create listing
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {filteredListings.map((listing) => {
            const isEditing = activeEditId === listing.id && editDraft;
            return (
              <Card key={listing.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">{listing.title}</h3>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(listing.status)}`}
                      >
                        {listing.status}
                      </span>
                      {listing.quantityRemaining <= 0 ? (
                        <Badge variant="danger">Sold out</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-neutral-600">{listing.description}</p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">
                    ${(listing.priceCents / 100).toFixed(2)}
                  </p>
                </div>

                <div className="grid gap-2 text-xs text-neutral-500 md:grid-cols-3">
                  <p>
                    Inventory: {listing.quantityRemaining}/{listing.quantityTotal}
                  </p>
                  <p>Pickup: {formatDateTime(listing.pickupWindowStart)}</p>
                  <p>Updated: {formatDateTime(listing.updatedAt)}</p>
                </div>

                {isEditing ? (
                  <div className="grid gap-3 rounded-xl border border-neutral-200 p-3">
                    <Input
                      label="Title"
                      value={editDraft.title}
                      onChange={(event) =>
                        setEditDraft((current) =>
                          current ? { ...current, title: event.target.value } : current,
                        )
                      }
                    />
                    <Textarea
                      label="Description"
                      value={editDraft.description}
                      onChange={(event) =>
                        setEditDraft((current) =>
                          current ? { ...current, description: event.target.value } : current,
                        )
                      }
                    />
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input
                        label="Price (cents)"
                        type="number"
                        min={0}
                        value={String(editDraft.discountedPriceCents)}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  discountedPriceCents: Number(event.target.value || "0"),
                                }
                              : current,
                          )
                        }
                      />
                      <Input
                        label="Quantity total"
                        type="number"
                        min={1}
                        value={String(editDraft.quantityTotal)}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  quantityTotal: Number(event.target.value || "1"),
                                }
                              : current,
                          )
                        }
                      />
                      <Input
                        label="Quantity remaining"
                        type="number"
                        min={0}
                        value={String(editDraft.quantityRemaining)}
                        onChange={(event) =>
                          setEditDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  quantityRemaining: Number(event.target.value || "0"),
                                }
                              : current,
                          )
                        }
                      />
                    </div>
                    <Textarea
                      label="Allergy notes"
                      value={editDraft.allergyNotes}
                      onChange={(event) =>
                        setEditDraft((current) =>
                          current ? { ...current, allergyNotes: event.target.value } : current,
                        )
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void saveEdit()} disabled={isMutating}>
                        Save changes
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (activeEditId) {
                            setEditDrafts((current) => {
                              const next = { ...current };
                              delete next[activeEditId];
                              return next;
                            });
                          }
                          setActiveEditId(null);
                          setEditDraft(null);
                        }}
                        disabled={isMutating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => beginEdit(listing)}>
                      Edit
                    </Button>
                    {listing.status === "active" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void runMutation(listing.id, {
                            method: "PATCH",
                            body: { action: "pause" },
                          })
                        }
                        disabled={isMutating}
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          void runMutation(listing.id, {
                            method: "PATCH",
                            body: { action: "activate" },
                          })
                        }
                        disabled={isMutating}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void runMutation(listing.id, {
                          method: "PATCH",
                          body: { action: "archive" },
                        })
                      }
                      disabled={isMutating}
                    >
                      Archive
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${listing.title}"? This action cannot be undone.`,
                          )
                        ) {
                          void runMutation(listing.id, { method: "DELETE" });
                        }
                      }}
                      disabled={isMutating}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
