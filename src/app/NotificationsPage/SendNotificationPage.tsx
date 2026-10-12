"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BulkNotificationSummary,
  RecipientType,
  fetchBulkNotificationHistory,
  sendNotification,
} from "@/utils/notificationService";

const HEADER_LIMIT = 50;
const MESSAGE_LIMIT = 300;

const RECIPIENT_OPTIONS: { label: string; value: RecipientType }[] = [
  { label: "Customer", value: "individual" },
  { label: "Chauffeur", value: "chauffeur" },
  { label: "PD", value: "pd" },
];

const SendNotificationPage = () => {
  const navigate = useNavigate();
  const [header, setHeader] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultCounts, setResultCounts] = useState<{
    successCount: number;
    failureCount: number;
  } | null>(null);
  const [pendingPayload, setPendingPayload] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [history, setHistory] = useState<BulkNotificationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const selectedRecipientLabel = useMemo(() => {
    return RECIPIENT_OPTIONS.find((option) => option.value === selectedRecipient)
      ?.label;
  }, [selectedRecipient]);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        const response = await fetchBulkNotificationHistory();
        if (!isMounted) return;
        setHistory(response.data ?? []);
        setHistoryError(null);
      } catch (error) {
        if (!isMounted) return;
        const message =
          error instanceof Error
            ? error.message
            : "Unable to fetch notification history.";
        setHistoryError(message);
        toast.error(message);
      } finally {
        if (!isMounted) return;
        setHistoryLoading(false);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedHeader = header.trim();
    const trimmedMessage = message.trim();

    if (!trimmedHeader) {
      toast.error("Header is required.");
      return;
    }

    if (!trimmedMessage) {
      toast.error("Message is required.");
      return;
    }

    if (!selectedRecipient) {
      toast.error("Please choose a recipient type.");
      return;
    }

    setPendingPayload({
      title: trimmedHeader,
      message: trimmedMessage,
    });
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!pendingPayload || !selectedRecipient) {
      toast.error("Unable to send notification. Please try again.");
      return;
    }

    setConfirmOpen(false);
    setIsSubmitting(true);
    setLoadingOpen(true);
    try {
      const response = await sendNotification({
        title: pendingPayload.title,
        message: pendingPayload.message,
        userType: selectedRecipient,
      });

      const successCount = response.data?.successCount ?? 0;
      const failureCount = response.data?.failureCount ?? 0;

      setResultCounts({ successCount, failureCount });
      setResultOpen(true);

      toast.success(
        response.message || "Bulk notification is being processed."
      );
      setHeader("");
      setMessage("");
      setSelectedRecipient("");
      setPendingPayload(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send notification. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setLoadingOpen(false);
      setPendingPayload(null);
    }
  };

  const handleConfirmOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      setConfirmOpen(false);
      setPendingPayload(null);
      return;
    }
    setConfirmOpen(open);
  };

  const handleResultClose = () => {
    setResultOpen(false);
    setResultCounts(null);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const formatDeliveryTime = (value: string) => {
    if (!value) {
      return "Not scheduled";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Not scheduled";
    }
    return parsed.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/admin/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {/* <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/admin/dashboard/Notifications">
              Notifications
            </BreadcrumbLink>
          </BreadcrumbItem> */}
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Send Notification</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {showForm && (
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-semibold">
              Send Notification
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/dashboard/Notifications/send")}
              disabled={isSubmitting}
            >
              cancel
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notification-header">
                    Header (max {HEADER_LIMIT} characters)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {header.length}/{HEADER_LIMIT}
                  </span>
                </div>
                <Input
                  id="notification-header"
                  value={header}
                  onChange={(event) => setHeader(event.target.value)}
                  maxLength={HEADER_LIMIT}
                  placeholder="Enter notification header"
                  disabled={isSubmitting}
                  className="transition-all duration-200 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notification-message">
                    Message (max {MESSAGE_LIMIT} characters)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {message.length}/{MESSAGE_LIMIT}
                  </span>
                </div>
                <Textarea
                  id="notification-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={MESSAGE_LIMIT}
                  placeholder="Enter notification message"
                  className="min-h-[160px] transition-all duration-200 focus-visible:ring-primary"
                  disabled={isSubmitting}
                />
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Recipient</legend>
                <RadioGroup
                  value={selectedRecipient}
                  onValueChange={(value) =>
                    setSelectedRecipient(value as RecipientType)
                  }
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {RECIPIENT_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`recipient-${option.value}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all duration-200",
                        selectedRecipient === option.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50 hover:bg-muted/60"
                      )}
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`recipient-${option.value}`}
                        disabled={isSubmitting}
                        className="h-5 w-5 border-2 border-muted-foreground text-primary transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 data-[state=checked]:ring-4 data-[state=checked]:ring-primary/20"
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </fieldset>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  className="transition-all duration-200"
                >
                  Hide Send Form
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="transition-all duration-200"
                >
                  {isSubmitting ? "Sending..." : "Send Notification"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">
              Notification History
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Track previously sent bulk notifications.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setShowForm((previous) => !previous)}
            variant={showForm ? "secondary" : "default"}
            className="transition-all duration-200"
          >
            {showForm ? "Hide Send Form" : "Compose Notification"}
          </Button>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={`history-skeleton-${index}`}
                  className="h-20 animate-pulse rounded-lg bg-muted/60"
                />
              ))}
            </div>
          ) : historyError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {historyError}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bulk notifications have been sent yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {history.map((item) => (
                <li
                  key={item.SK}
                  className="rounded-xl border border-border/70 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-muted/60"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="capitalize bg-primary/10 text-primary"
                    >
                      {RECIPIENT_OPTIONS.find(
                        (option) => option.value === item.user_type
                      )?.label || item.user_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDeliveryTime(item.delivery_time)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                      Success: {item.data?.successCount ?? 0}
                    </div>
                    <div className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                      Failed: {item.data?.failureCount ?? 0}
                    </div>
                    <div className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                      #{item.SK.replace("NOTIF#", "")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={handleConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send notification?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send this notification to{" "}
              {selectedRecipientLabel || "the selected group"}. Once initiated,
              the bulk notification process cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="mb-2 text-foreground">
              <span className="font-semibold">Header:</span>{" "}
              {pendingPayload?.title || "-"}
            </p>
            <p className="mb-2 text-foreground">
              <span className="font-semibold">Recipient:</span>{" "}
              {selectedRecipientLabel || "-"}
            </p>
            <div>
              <p className="font-semibold text-foreground">Message:</p>
              <p className="whitespace-pre-wrap">
                {pendingPayload?.message || "-"}
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSend}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={loadingOpen} onOpenChange={() => {}}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Sending notifications</DialogTitle>
            <DialogDescription>
              Please wait while we queue the notification batch.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              This may take a few moments.
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resultOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleResultClose();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk notification status</DialogTitle>
            <DialogDescription>
              The notification request has been processed by the server.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Successes:</span>{" "}
              {resultCounts?.successCount ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Failures:</span>{" "}
              {resultCounts?.failureCount ?? 0}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleResultClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendNotificationPage;
