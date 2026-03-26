import { motion } from "framer-motion";
import { mockReviews } from "@/data/mockData";
import { Star, MessageSquare } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const ReviewsPage = () => {
  const avgRating =
    mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Average */}
      <motion.div variants={itemVariants} className="card-soft p-5 text-center">
        <div className="flex items-center justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-6 h-6 ${
                s <= Math.round(avgRating)
                  ? "text-primary fill-primary"
                  : "text-border"
              }`}
            />
          ))}
        </div>
        <p className="text-3xl font-extrabold font-heading text-foreground">
          {avgRating.toFixed(1)}
        </p>
        <p className="text-sm text-muted-foreground">
          {mockReviews.length} recensioni
        </p>
      </motion.div>

      {/* Reviews List */}
      <div className="space-y-3">
        {mockReviews.map((review) => (
          <motion.div key={review.id} variants={itemVariants} className="card-soft p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold font-heading text-sm text-foreground">
                  {review.clientName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {review.petName} · {review.service}
                </p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= review.rating
                        ? "text-primary fill-primary"
                        : "text-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              {new Date(review.date).toLocaleDateString("it-IT")}
            </p>
            {review.reply && (
              <div className="mt-3 p-3 bg-secondary rounded-soft">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold text-primary">Risposta del toelettatore</span>
                </div>
                <p className="text-xs text-foreground">{review.reply}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ReviewsPage;
