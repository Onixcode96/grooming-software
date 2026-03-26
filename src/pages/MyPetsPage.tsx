import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Heart, AlertTriangle, Calendar, ChevronRight, Trash2, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { usePets, useAddPet, useDeletePet, type Pet } from "@/hooks/usePets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  return differenceInYears(new Date(), new Date(dob));
};

const PetCardSkeleton = () => (
  <div className="card-soft p-4">
    <div className="flex items-start gap-4">
      <Skeleton className="w-16 h-16 rounded-soft shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-14 rounded-pill" />
          <Skeleton className="h-5 w-16 rounded-pill" />
        </div>
      </div>
      <Skeleton className="w-5 h-5 shrink-0 mt-2" />
    </div>
  </div>
);

const MyPetsPage = () => {
  const { t } = useTranslation();
  const { formatWeight, weightUnit } = useLocale();
  const { data: pets = [], isLoading } = usePets();
  const addPet = useAddPet();
  const deletePet = useDeletePet();

  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("dog");
  const [newBreed, setNewBreed] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDob, setNewDob] = useState<Date | undefined>(undefined);

  const resetForm = () => {
    setNewName(""); setNewType("dog"); setNewBreed(""); setNewWeight(""); setNewNotes(""); setNewDob(undefined);
  };

  const handleAddPet = async () => {
    if (!newName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    addPet.mutate({
      user_id: user.id,
      name: newName.trim(),
      type: newType,
      breed: newBreed.trim(),
      weight: parseFloat(newWeight) || 0,
      photo: newType === "dog" ? "🐕" : "🐱",
      notes: newNotes.trim() || null,
      allergies: newNotes.trim() ? [newNotes.trim()] : null,
      date_of_birth: newDob ? format(newDob, "yyyy-MM-dd") : null,
      age: newDob ? differenceInYears(new Date(), newDob) : 0,
    }, { onSuccess: () => { resetForm(); setShowAddDialog(false); } });
  };

  const handleDelete = () => {
    if (!petToDelete) return;
    deletePet.mutate(petToDelete.id, { onSuccess: () => setPetToDelete(null) });
  };

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-heading text-foreground">{t("pets.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? t("common.loading") : (pets.length !== 1 ? t("pets.registeredFriends_plural", { count: pets.length }) : t("pets.registeredFriends", { count: pets.length }))}
            </p>
          </div>
          <Button variant="hero" size="sm" className="gap-1" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4" /> {t("common.add")}
          </Button>
        </motion.div>

        {isLoading && <div className="space-y-4"><PetCardSkeleton /><PetCardSkeleton /></div>}

        {!isLoading && pets.length === 0 && (
          <motion.div variants={itemVariants} className="card-soft p-8 text-center space-y-3">
            <p className="text-4xl">🐾</p>
            <p className="text-muted-foreground font-medium">{t("pets.noPets")}</p>
            <p className="text-sm text-muted-foreground">{t("pets.noPetsDesc")}</p>
            <Button variant="hero" size="sm" className="gap-1 mt-2" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4" /> {t("pets.addPet")}
            </Button>
          </motion.div>
        )}

        {!isLoading && pets.map((pet) => (
          <motion.div key={pet.id} variants={itemVariants}>
            <Link to={`/pets/${pet.id}`}>
              <div className="card-soft p-4 hover:shadow-soft transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-soft gradient-primary flex items-center justify-center text-3xl shrink-0">{pet.photo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold font-heading text-lg text-foreground">{pet.name}</h3>
                      <Heart className="w-4 h-4 text-primary fill-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{pet.breed || t("pets.noBreed")}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-secondary text-[11px] font-semibold text-secondary-foreground">
                        {pet.type === "dog" ? `🐕 ${t("common.dog")}` : `🐱 ${t("common.cat")}`}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-secondary text-[11px] font-semibold text-secondary-foreground">
                        ⚖️ {formatWeight(pet.weight)}
                      </span>
                      {(() => {
                        const age = calculateAge(pet.date_of_birth);
                        return age !== null ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-secondary text-[11px] font-semibold text-secondary-foreground">
                            🎂 {age} {t("common.yrs")}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {pet.allergies && pet.allergies.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        {t("pets.allergies")}: {pet.allergies.join(", ")}
                      </div>
                    )}
                    {pet.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{pet.notes}"</p>}
                    {pet.last_visit && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {t("pets.lastVisit")}: {pet.last_visit}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
                </div>
                <div className="flex justify-end mt-2 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPetToDelete(pet); }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`${t("common.delete")} ${pet.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("common.remove")}
                  </button>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <Dialog open={!!petToDelete} onOpenChange={(open) => !open && setPetToDelete(null)}>
        <DialogContent className="rounded-soft">
          <DialogHeader>
            <DialogTitle>{t("pets.deletePet", { name: petToDelete?.name })}</DialogTitle>
            <DialogDescription>{t("pets.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPetToDelete(null)} disabled={deletePet.isPending}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePet.isPending}>
              {deletePet.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { resetForm(); setShowAddDialog(false); } }}>
        <DialogContent className="rounded-soft max-w-md">
          <DialogHeader>
            <DialogTitle>{t("pets.addNewPet")}</DialogTitle>
            <DialogDescription>{t("pets.tellUs")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pet-name">{t("pets.petName")} *</Label>
              <Input id="pet-name" placeholder={t("pets.petNamePlaceholder")} value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label>{t("pets.species")}</Label>
              <RadioGroup value={newType} onValueChange={setNewType} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dog" id="type-dog" />
                  <Label htmlFor="type-dog" className="cursor-pointer">🐕 {t("common.dog")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="cat" id="type-cat" />
                  <Label htmlFor="type-cat" className="cursor-pointer">🐱 {t("common.cat")}</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-breed">{t("pets.breed")}</Label>
              <Input id="pet-breed" placeholder={t("pets.breedPlaceholder")} value={newBreed} onChange={(e) => setNewBreed(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>{t("pets.dateOfBirth")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newDob && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDob ? format(newDob, "dd/MM/yyyy") : t("pets.selectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={newDob} onSelect={setNewDob} disabled={(date) => date > new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-weight">{t("pets.weight")}</Label>
              <Input id="pet-weight" type="number" placeholder={t("pets.weightPlaceholder")} min={0} max={200} value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet-notes">{t("pets.allergiesNotes")}</Label>
              <Textarea id="pet-notes" placeholder={t("pets.allergiesPlaceholder")} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} maxLength={500} rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { resetForm(); setShowAddDialog(false); }} disabled={addPet.isPending}>{t("common.cancel")}</Button>
            <Button variant="hero" onClick={handleAddPet} disabled={addPet.isPending}>
              {addPet.isPending ? t("common.saving") : t("pets.savePet")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyPetsPage;
