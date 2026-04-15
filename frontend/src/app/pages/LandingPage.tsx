import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, MessageCircle, Search, ShieldCheck, Users, RefreshCw, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const highlights = [
  {
    icon: BookOpen,
    title: 'Discover books',
    description: 'Browse a growing catalog of community-shared books across Morocco.',
  },
  {
    icon: MessageCircle,
    title: 'Talk to owners',
    description: 'Message readers directly to arrange safe and simple exchanges.',
  },
  {
    icon: ShieldCheck,
    title: 'Stay protected',
    description: 'Built-in moderation tools help keep the community trusted and respectful.',
  },
];

const steps = [
  'Create your free account in minutes.',
  'Add the books you want to share or exchange.',
  'Connect with readers and organize a swap.',
];

export function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_35%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <Star className="h-4 w-4 text-amber-500" />
              KtabNet.ma — a community for book lovers
            </div>

            <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Share books, discover readers, build community.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              KtabNet.ma helps readers across Morocco exchange books, start conversations, and
              keep great stories moving from shelf to shelf.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-w-44">
                <Link to="/register">
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-44">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                { value: 'Books', label: 'to discover and share', icon: BookOpen },
                { value: 'Readers', label: 'connecting through swaps', icon: Users },
                { value: 'Messages', label: 'to arrange exchanges', icon: MessageCircle },
              ].map((stat) => (
                <Card key={stat.value} className="border bg-background/70 shadow-sm backdrop-blur">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-semibold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <Card key={item.title} className="h-full border shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                A simple way to exchange books.
              </h2>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                Join, publish your books, and connect with people who want to read them next.
                Everything is designed to feel quick, familiar, and easy to trust.
              </p>

              <div className="mt-8 space-y-4">
                {steps.map((step, index) => (
                  <div key={step} className="flex items-start gap-4 rounded-2xl border p-4 shadow-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {index + 1}
                    </div>
                    <p className="pt-0.5 text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/register">
                    Start free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/login">Already have an account?</Link>
                </Button>
              </div>
            </div>

            <Card className="border bg-gradient-to-br from-primary/5 to-background shadow-lg">
              <CardContent className="space-y-6 p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Why join?</h3>
                    <p className="text-sm text-muted-foreground">Built for readers who want more than a static library.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    'Find new reads from your city and beyond.',
                    'Swap books with verified community members.',
                    'Keep your collection moving instead of collecting dust.',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border bg-background/80 p-4">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}