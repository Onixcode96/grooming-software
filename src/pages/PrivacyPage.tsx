import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrivacyContent } from "@/components/PrivacyContent";

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Indietro
      </Button>
      <PrivacyContent />
    </div>
  );
};

export default PrivacyPage;
