import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dogBreeds, catBreeds } from "@/data/mockData";
import { useServices } from "@/hooks/useServices";
import { useSettings } from "@/hooks/useSettings";
import { useDiscounts, getDiscountForService } from "@/hooks/useDiscounts";
import PawAnimation from "@/components/PawAnimation";
import { ArrowLeft, ArrowRight, Check, Clock, DollarSign, ChevronLeft, ChevronRight, Loader2, Banknote, CreditCard, Tag } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { toast } from "@/hooks/use-toast";
import { useSlotAvailability } from "@/hooks/useSlotAvailability";
import { supabase } from "@/integrations/supabase/client";
import { sendPushNotification } from "@/hooks/usePushNotifications";
import { format, addDays, subDays, isBefore, startOfToday } from "date-fns";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";

type AnimalType = "dog" | "cat" | "other" | null;

const BookingPage = () => {
  const { t } = useTranslation();
  const { dateFnsLocale, formatPrice, formatTime } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get("service");
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: settings } = useSettings();
  const { data: discounts = [] } = useDiscounts();

  const [step, setStep] = useState(0);
  const [animalType, setAnimalType] = useState<AnimalType>(null);
  const [customAnimal, setCustomAnimal] = useState("");
  const [breed, setBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [size, setSize] = useState("");
  const [selectedService, setSelectedService] = useState(preselectedService || "");
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(startOfToday(), "yyyy-MM-dd"));
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online" | "pending">("pending");
  const [isLoyal, setIsLoyal] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const checkLoyalty = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["confirmed", "completed"]);
      setIsLoyal((count ?? 0) > 3);
    };
    checkLoyalty();
  }, []);

  const allowCash = settings?.allow_cash ?? true;
  const allowOnline = settings?.allow_online ?? false;

  useEffect(() => {
    if (allowCash && !allowOnline) setPaymentMethod("cash");
    else if (!allowCash && allowOnline) setPaymentMethod("online");
    else if (allowCash && allowOnline) setPaymentMethod("cash");
    else setPaymentMethod("pending");
  }, [allowCash, allowOnline]);

  const breeds = animalType === "dog" ? dogBreeds : animalType === "cat" ? catBreeds : [];
  const hasPreselectedService = !!preselectedService;
  const currentService = services.find((s) => s.id === selectedService);
  const basePrice = currentService?.price ?? 0;
  const duration = currentService?.duration_minutes ?? 0;

  const discountPercent = selectedService
    ? getDiscountForService(discounts, selectedService, isLoyal)
    : 0;
  const price = discountPercent > 0
    ? Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100
    : basePrice;

  const { availableSlots, conflictSlots, loading: slotsLoading } = useSlotAvailability(selectedDate, duration);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  const petSizes = [
    { id: "xs", label: t("sizes.xs"), weight: t("sizeWeights.xs"), icon: "🐾" },
    { id: "sm", label: t("sizes.sm"), weight: t("sizeWeights.sm"), icon: "🐕" },
    { id: "md", label: t("sizes.md"), weight: t("sizeWeights.md"), icon: "🐕‍🦺" },
    { id: "lg", label: t("sizes.lg"), weight: t("sizeWeights.lg"), icon: "🦮" },
    { id: "xl", label: t("sizes.xl"), weight: t("sizeWeights.xl"), icon: "🐻" },
  ];

  const allSteps = [
    t("booking.animalStep"), t("booking.breedStep"), t("booking.sizeStep"),
    t("booking.serviceStep"), t("booking.dateTimeStep"), t("booking.confirmStep")
  ];

  const getSteps = () => {
    let s = [...allSteps];
    if (hasPreselectedService) s = s.filter((_, i) => i !== 3);
    if (animalType === "other") s = s.filter((_, i) => i !== 1);
    return s;
  };
  const steps = getSteps();

  const getStepMap = () => {
    if (animalType !== "other") {
      if (hasPreselectedService) return [0, 1, 2, 4, 5];
      return [0, 1, 2, 3, 4, 5];
    }
    if (hasPreselectedService) return [0, 2, 4, 5];
    return [0, 2, 3, 4, 5];
  };
  const stepMap = getStepMap();
  const logicalStep = stepMap[step] ?? step;

  useEffect(() => {
    if (confirmed) return;
    window.history.pushState({ bookingStep: step }, "");
    const handlePopState = (e: PopStateEvent) => {
      if (step > 0) {
        e.preventDefault();
        setStep((prev) => Math.max(0, prev - 1));
      } else {
        e.preventDefault();
        setShowExitDialog(true);
        window.history.pushState({ bookingStep: 0 }, "");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [step, confirmed]);

  const canNext = () => {
    switch (logicalStep) {
      case 0: return animalType === "other" ? !!customAnimal.trim() : !!animalType;
      case 1: return breed === "__other__" ? !!customBreed.trim() : !!breed;
      case 2: return !!size;
      case 3: return !!selectedService;
      case 4: return !!selectedDate && !!selectedTime;
      default: return true;
    }
  };

  const getAnimalLabel = () => {
    if (animalType === "dog") return t("common.dog").toLowerCase();
    if (animalType === "cat") return t("common.cat").toLowerCase();
    return customAnimal || "pet";
  };

  const getAnimalEmoji = () => {
    if (animalType === "dog") return "🐕";
    if (animalType === "cat") return "🐱";
    return "🐾";
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: t("common.error"), description: t("booking.mustBeLoggedIn"), variant: "destructive" });
        setConfirming(false);
        return;
      }

      const animalTypeValue = animalType === "other" ? customAnimal : animalType!;
      const breedValue = animalType === "other" ? customAnimal : (breed === "__other__" ? customBreed : breed);

      const { data: appointmentId, error } = await supabase.rpc("book_appointment", {
        p_user_id: user.id,
        p_animal_type: animalTypeValue,
        p_breed: breedValue,
        p_size: size,
        p_service_id: selectedService,
        p_service_name: currentService?.name || "",
        p_date: selectedDate,
        p_time: selectedTime,
        p_duration_minutes: duration,
        p_price: price,
        p_notes: notes,
        p_payment_method: paymentMethod,
      });

      if (error) {
        if (error.message?.includes("SLOT_TAKEN")) {
          toast({
            title: t("booking.slotTaken"),
            description: t("booking.slotTakenDesc"),
            variant: "destructive",
          });
          setSelectedTime("");
          setStep(steps.length - 2);
        } else {
          toast({ title: t("common.error"), description: error.message, variant: "destructive" });
        }
        setConfirming(false);
        return;
      }

      if (paymentMethod === "online") {
        try {
          const res = await supabase.functions.invoke("create-checkout", {
            body: {
              appointment_id: appointmentId,
              amount: price,
              service_name: currentService?.name || "",
              origin_url: window.location.origin,
            },
          });

          if (res.error || !res.data?.url) {
            toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" });
            setConfirming(false);
            return;
          }

          window.location.href = res.data.url;
          return;
        } catch {
          toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" });
          setConfirming(false);
          return;
        }
      }

      const isConflict = conflictSlots.has(selectedTime);
      setConfirmed(true);
      toast({
        title: isConflict ? t("booking.requestSent") : t("booking.bookingConfirmed"),
        description: isConflict
          ? t("booking.requestSentDesc")
          : `${currentService?.name} - ${selectedDate} ${t("common.at")} ${selectedTime}`,
      });

      const { data: adminId } = await supabase.rpc("get_admin_user_id");
      if (adminId) {
        sendPushNotification(adminId, t("chatAuto.pushNewBookingTitle"), t("chatAuto.pushNewBookingBody", { service: currentService?.name, date: selectedDate, time: selectedTime }), "/admin-portal-onix/appointments");
      }
    } catch (e) {
      toast({ title: t("common.error"), description: t("common.error"), variant: "destructive" });
    }
    setConfirming(false);
  };

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <PawAnimation />
        <h2 className="text-2xl font-extrabold font-heading text-foreground mt-4 mb-2">
          {t("booking.confirmed")}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t("booking.seeYou", { date: selectedDate, time: selectedTime })}
        </p>
        <div className="card-soft p-4 w-full mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("booking.service")}</span>
              <span className="font-semibold text-foreground">{currentService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("booking.duration")}</span>
              <span className="font-semibold text-foreground">{duration} {t("common.min")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("booking.price")}</span>
              <span className="font-bold text-primary text-lg">{formatPrice(price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("booking.payment")}</span>
              <span className="font-semibold text-foreground">{paymentMethod === "cash" ? t("booking.cash") : t("booking.online")}</span>
            </div>
          </div>
        </div>
        <Button variant="hero" size="lg" onClick={() => navigate("/dashboard")}>
          {t("booking.backToHome")}
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-soft">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("booking.exitTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("booking.exitMessage")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("booking.exitStay")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/dashboard")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("booking.exitLeave")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-pill transition-all ${
                i <= step ? "gradient-primary" : "bg-secondary"
              }`}
            />
            <span className={`text-[9px] font-semibold font-heading ${
              i <= step ? "text-primary" : "text-muted-foreground"
            }`}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={logicalStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* Step 0: Animal Type */}
          {logicalStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading text-foreground">
                {t("booking.whatAnimal")}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: "dog" as const, emoji: "🐕", label: t("common.dog") },
                  { type: "cat" as const, emoji: "🐱", label: t("common.cat") },
                  { type: "other" as const, emoji: "🐾", label: t("common.other") },
                ].map((item) => (
                  <motion.button
                    key={item.type}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setAnimalType(item.type);
                      if (item.type !== "other") {
                        setCustomAnimal("");
                        setBreed("");
                      }
                    }}
                    className={`card-soft p-5 flex flex-col items-center gap-2 transition-all duration-200 relative ${
                      animalType === item.type
                        ? "ring-2 ring-primary bg-primary/5 shadow-hover"
                        : ""
                    }`}
                  >
                    {animalType === item.type && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <span className="text-4xl">{item.emoji}</span>
                    <span className="font-bold font-heading text-foreground text-sm">{item.label}</span>
                  </motion.button>
                ))}
              </div>
              {animalType === "other" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="text-sm font-semibold font-heading text-foreground mb-1 block">
                    {t("booking.specifyAnimal")}
                  </label>
                  <Input
                    value={customAnimal}
                    onChange={(e) => setCustomAnimal(e.target.value)}
                    placeholder={t("booking.animalPlaceholder")}
                    className="mt-1"
                    autoFocus
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* Step 1: Breed */}
          {logicalStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading text-foreground">
                {t("booking.selectBreed")}
              </h2>
              <div className="grid grid-cols-2 gap-2 pb-4">
                {breeds.map((b) => (
                  <motion.button
                    key={b}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setBreed(b); setCustomBreed(""); }}
                    className={`card-soft p-3 text-sm font-semibold font-heading text-left transition-all duration-200 relative ${
                      breed === b ? "ring-2 ring-primary bg-primary/5 shadow-hover" : ""
                    }`}
                  >
                    {breed === b && (
                      <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {b}
                  </motion.button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setBreed("__other__")}
                  className={`card-soft p-3 text-sm font-semibold font-heading text-left transition-all duration-200 relative ${
                    breed === "__other__" ? "ring-2 ring-primary bg-primary/5 shadow-hover" : ""
                  }`}
                >
                  {breed === "__other__" && (
                    <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  {t("booking.otherBreed")}
                </motion.button>
              </div>
              {breed === "__other__" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="text-sm font-semibold font-heading text-foreground mb-1 block">
                    {t("booking.specifyBreed")}
                  </label>
                  <Input
                    value={customBreed}
                    onChange={(e) => setCustomBreed(e.target.value)}
                    placeholder={t("booking.breedInputPlaceholder")}
                    className="mt-1"
                    autoFocus
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* Step 2: Size */}
          {logicalStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading text-foreground">
                {t("booking.sizeWeight")}
              </h2>
              <div className="space-y-2">
                {petSizes.map((s) => (
                  <motion.button
                    key={s.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSize(s.id)}
                    className={`card-soft p-4 w-full flex items-center gap-4 transition-all duration-200 relative ${
                      size === s.id ? "ring-2 ring-primary bg-primary/5 shadow-hover" : ""
                    }`}
                  >
                    {size === s.id && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <span className="text-3xl">{s.icon}</span>
                    <div className="text-left">
                      <p className="font-bold font-heading text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.weight}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Service */}
          {logicalStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading text-foreground">
                {t("booking.chooseService")}
              </h2>
              <div className="space-y-2">
                {services.map((s) => (
                  <motion.button
                    key={s.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedService(s.id)}
                    className={`card-soft p-4 w-full text-left transition-all duration-200 relative ${
                      selectedService === s.id ? "ring-2 ring-primary bg-primary/5 shadow-hover" : ""
                    }`}
                  >
                    {selectedService === s.id && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{s.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-bold font-heading text-foreground">{s.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" /> {s.duration_minutes} {t("common.min")}
                          </span>
                          <span className="flex items-center gap-1 text-sm font-bold text-primary">
                            <DollarSign className="w-3 h-3" /> {formatPrice(s.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Date & Time */}
          {logicalStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading text-foreground">
                {t("booking.whenPrefer")}
              </h2>

              <div className="space-y-3">
                <label className="text-sm font-semibold font-heading text-foreground">{t("booking.date")}</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    disabled={isBefore(new Date(selectedDate), addDays(startOfToday(), 1))}
                    onClick={() => {
                      setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"));
                      setSelectedTime("");
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 card-soft p-3 text-center font-bold font-heading text-foreground capitalize">
                    {format(new Date(selectedDate), "EEEE, MMMM d, yyyy", { locale: dateFnsLocale })}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"));
                      setSelectedTime("");
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold font-heading text-foreground">
                  {t("booking.availableSlots")}
                </label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="card-soft p-6 text-center">
                    <p className="text-muted-foreground font-semibold">
                      {t("booking.noSlots")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("booking.noSlotsHint")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      const isConflict = conflictSlots.has(slot);
                      return (
                        <motion.button
                          key={slot}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedTime(slot);
                            setShowConflictWarning(isConflict);
                          }}
                          className={`p-2 rounded-soft text-sm font-semibold font-heading border transition-all relative ${
                            selectedTime === slot
                              ? "bg-primary text-primary-foreground shadow-soft border-primary"
                              : isConflict
                              ? "bg-amber-50 dark:bg-amber-950/30 text-foreground border-amber-300 dark:border-amber-700"
                              : "bg-card text-foreground border-border hover:bg-secondary"
                          }`}
                        >
                          {formatTime(slot)}
                          {isConflict && selectedTime !== slot && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {showConflictWarning && selectedTime && conflictSlots.has(selectedTime) && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-soft p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700"
                  >
                    <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold">
                      {t("booking.conflictWarning")}
                    </p>
                  </motion.div>
                )}

                <p className="text-[10px] text-muted-foreground text-center italic">
                  {t("booking.slotsHint")}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold font-heading text-foreground">
                  {t("booking.specialNotes")}
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("booking.notesPlaceholder")}
                  className="rounded-soft border-border bg-card"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {logicalStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-heading text-foreground">
                {t("booking.summary")}
              </h2>
              <div className="card-soft p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <span className="text-3xl">{getAnimalEmoji()}</span>
                  <div>
                    <p className="font-bold font-heading text-foreground">
                      {animalType === "other" ? customAnimal : breed}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("booking.size")}: {petSizes.find((s) => s.id === size)?.label}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking.service")}</span>
                    <span className="font-semibold text-foreground">
                      {currentService?.icon} {currentService?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking.date")}</span>
                    <span className="font-semibold text-foreground capitalize">{format(new Date(selectedDate), "EEEE, MMMM d", { locale: dateFnsLocale })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking.dateTimeStep")}</span>
                    <span className="font-semibold text-foreground">{formatTime(selectedTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking.estDuration")}</span>
                    <span className="font-semibold text-foreground">{duration} {t("common.min")}</span>
                  </div>
                  {notes && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-muted-foreground text-xs mb-1">{t("booking.notes")}:</p>
                      <p className="text-foreground text-xs">{notes}</p>
                    </div>
                  )}
                  {discountPercent > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {t("booking.loyaltyDiscount")}
                      </span>
                      <span className="font-bold text-green-600">-{discountPercent}%</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-border">
                    <span className="font-bold text-foreground">{t("booking.total")}</span>
                    <div className="text-right">
                      {discountPercent > 0 && (
                        <span className="text-sm text-muted-foreground line-through mr-2">{formatPrice(basePrice)}</span>
                      )}
                      <span className="text-xl font-extrabold text-primary">{formatPrice(price)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              {(allowCash || allowOnline) && (
                <div className="space-y-3">
                  <h3 className="font-bold font-heading text-foreground text-sm">{t("booking.paymentMethod")}</h3>
                  
                  {/* Both methods enabled: show selector */}
                  {allowCash && allowOnline && (
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPaymentMethod("cash")}
                        className={`card-soft p-4 flex flex-col items-center gap-2 transition-all duration-200 relative ${
                          paymentMethod === "cash" ? "ring-2 ring-primary bg-primary/5 shadow-hover" : ""
                        }`}
                      >
                        {paymentMethod === "cash" && (
                          <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <Banknote className="w-6 h-6 text-primary" />
                        <span className="font-bold font-heading text-sm text-foreground">{t("booking.payCash")}</span>
                        <span className="text-[10px] text-muted-foreground">{t("booking.payOnArrival")}</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPaymentMethod("online")}
                        className={`card-soft p-4 flex flex-col items-center gap-2 transition-all duration-200 relative ${
                          paymentMethod === "online" ? "ring-2 ring-primary bg-primary/5 shadow-hover" : ""
                        }`}
                      >
                        {paymentMethod === "online" && (
                          <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <CreditCard className="w-6 h-6 text-primary" />
                        <span className="font-bold font-heading text-sm text-foreground">{t("booking.payOnline")}</span>
                        <span className="text-[10px] text-muted-foreground">{t("booking.payOnlineDesc")}</span>
                      </motion.button>
                    </div>
                  )}

                  {/* Only cash */}
                  {allowCash && !allowOnline && (
                    <div className="card-soft p-4 flex items-center gap-3 bg-secondary/30">
                      <Banknote className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-bold text-sm text-foreground">{t("booking.payCash")}</p>
                        <p className="text-xs text-muted-foreground">{t("booking.cashOnlyMsg")}</p>
                      </div>
                    </div>
                  )}

                  {/* Only online */}
                  {!allowCash && allowOnline && (
                    <div className="card-soft p-4 flex items-center gap-3 bg-secondary/30">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-bold text-sm text-foreground">{t("booking.payOnline")}</p>
                        <p className="text-xs text-muted-foreground">{t("booking.onlineRequiredMsg")}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {settings?.cancellation_policy && (
                <div className="card-soft p-3 bg-secondary/50">
                  <p className="text-[10px] font-semibold font-heading text-muted-foreground uppercase tracking-wide mb-1">
                    {t("booking.cancellationPolicy")}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {settings.cancellation_policy}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> {t("common.back")}
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button
            variant="hero"
            size="lg"
            className="flex-1"
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
          >
            {t("common.next")} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button variant="hero" size="lg" className="flex-1" onClick={handleConfirm} disabled={confirming}>
            {confirming ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            {confirming ? t("booking.booking") : t("common.confirm")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
