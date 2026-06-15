"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWedding } from "@/hooks/use-weddings";
import { apiErrorMessage } from "@/lib/api";

interface CreateWeddingForm {
  wedding_name: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  ceremony_venue: string;
  story_description: string;
}

const EMPTY: CreateWeddingForm = {
  wedding_name: "",
  bride_name: "",
  groom_name: "",
  wedding_date: "",
  ceremony_venue: "",
  story_description: "",
};

export function CreateWeddingForm() {
  const [error, setError] = useState<string | null>(null);
  const createWedding = useCreateWedding();
  const form = useForm<CreateWeddingForm>({ defaultValues: EMPTY });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await createWedding.mutateAsync({
        wedding_name: values.wedding_name,
        bride_name: values.bride_name,
        groom_name: values.groom_name,
        wedding_date: values.wedding_date || null,
        ceremony_venue: values.ceremony_venue || null,
        story_description: values.story_description || null,
      });
      // On success the weddings query is invalidated and WeddingPage re-renders
      // with the new wedding — no navigation needed.
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
            <Heart className="h-5 w-5 text-emerald-600" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Create your wedding
            </h2>
            <p className="text-sm text-zinc-500">
              Set up your wedding project to start managing guests, RSVPs and more.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="wedding_name">Wedding name</Label>
            <Input
              id="wedding_name"
              placeholder="e.g. Sophea & Visal"
              {...form.register("wedding_name", { required: true })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bride_name">Bride name</Label>
              <Input
                id="bride_name"
                {...form.register("bride_name", { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="groom_name">Groom name</Label>
              <Input
                id="groom_name"
                {...form.register("groom_name", { required: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="wedding_date">Wedding date</Label>
              <Input id="wedding_date" type="date" {...form.register("wedding_date")} />
            </div>
            <div>
              <Label htmlFor="ceremony_venue">Ceremony venue</Label>
              <Input id="ceremony_venue" {...form.register("ceremony_venue")} />
            </div>
          </div>
          <div>
            <Label htmlFor="story_description">Your story (optional)</Label>
            <Textarea
              id="story_description"
              rows={3}
              {...form.register("story_description")}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={createWedding.isPending}>
              {createWedding.isPending ? "Creating..." : "Create Wedding"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
