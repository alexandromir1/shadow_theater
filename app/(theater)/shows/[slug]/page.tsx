import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { Reveal } from "@/components/motion/Reveal";
import { MagicalBackground } from "@/components/scene/MagicalBackground";
import { MagicButton } from "@/components/theater/MagicButton";
import { track } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { formatShowDateTime } from "@/lib/mock/shows";
import { getSeatsForShow, getShowBySlug } from "@/lib/db";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  if (!show) return { title: "Спектакль" };
  return {
    title: show.title,
    description: show.short_description || show.description,
    openGraph: {
      title: `Театр теней Мии — «${show.title}»`,
      description: show.short_description || show.description,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ShowPage({ params }: Props) {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  if (!show) notFound();

  if (show.status === "draft" || show.status === "archived") {
    const admin = await isAdminAuthenticated();
    if (!admin) notFound();
  }

  if (show.status !== "published" && show.status !== "cancelled" && show.status !== "draft") {
    notFound();
  }

  track("show_viewed", { showId: show.id, showTitle: show.title });
  const seats = await getSeatsForShow(show.id);
  const cancelled = show.status === "cancelled";
  const draftPreview = show.status === "draft";

  return (
    <main className="relative">
      <MagicalBackground className="min-h-screen" intensity="soft" showForest parallax>
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-end px-6 pb-16 pt-24">
          <Reveal>
            {draftPreview && (
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--gold-soft)]">
                Черновик · предпросмотр
              </p>
            )}
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
              Спектакль
            </p>
            <h1 className="mt-3 font-display text-4xl text-[var(--cream)] text-glow-gold md:text-5xl">
              {show.title}
            </h1>
            <p className="mt-4 text-[var(--cream-muted)]">
              {formatShowDateTime(show.date, show.start_time)}
            </p>
            <p className="mt-1 text-sm text-[var(--cream-muted)]">
              {show.duration_minutes} мин · {show.venue}
            </p>
            <p className="mt-6 max-w-xl leading-relaxed text-[var(--cream-muted)]">
              {show.description}
            </p>
            {cancelled ? (
              <p className="mt-8 font-display text-2xl text-[var(--gold)]">
                Спектакль отменён
              </p>
            ) : (
              <div className="mt-8">
                <MagicButton href="#zal">Выбрать места</MagicButton>
              </div>
            )}
          </Reveal>
        </div>

        {!cancelled && (
          <section id="zal" className="relative px-6 pb-[var(--space-section)] pt-8">
            <div className="mx-auto max-w-3xl">
              <Reveal>
                <h2 className="mb-10 text-center font-display text-3xl text-[var(--cream)]">
                  Зал
                </h2>
              </Reveal>
              <BookingFlow show={show} seats={seats} />
            </div>
          </section>
        )}
      </MagicalBackground>
    </main>
  );
}
