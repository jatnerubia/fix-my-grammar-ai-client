"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { useSuggestionStore } from "@/stores/use-suggestion-store"
import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { LuLoader2, LuSend } from "react-icons/lu"
import { z } from "zod"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

async function generateText(formData: { prompt: string }) {
  const res = await fetch(`${BASE_URL}/text-generation`, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
  if (!res.ok) {
    throw new Error("Server error")
  }
  const data = await res.json()
  return data
}

export const SuggestionForm = () => {
  const setSuggestions = useSuggestionStore((state) => state.setSuggestions)

  const form = useForm({
    defaultValues: {
      prompt: "",
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
    validatorAdapter: zodValidator(),
  })

  const mutation = useMutation({
    mutationKey: ["prompt"],
    mutationFn: generateText,
    onError: () => {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      })
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions)
    },
    onSettled: () => {
      form.reset()
    },
  })

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      if (!event.shiftKey) {
        event.preventDefault()
        form.handleSubmit()
      }
    }
  }

  return (
    <form
      className='container mx-auto lg:max-w-4xl flex items-start gap-2 px-4'
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field
        name='prompt'
        validators={{
          onChange: z
            .string()
            .min(1, { message: "Must be at least 1 character." })
            .max(2000, { message: "Must be no more than 2000 characters." }),
        }}
      >
        {(field) => (
          <div className='w-full flex flex-col gap-1'>
            <Textarea
              className='w-full resize-none'
              name={field.name}
              value={field.state.value}
              placeholder='Type your message here.'
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={mutation.isPending}
            />
            {field.state.meta.errors ? (
              <em role='alert' className='text-xs'>
                {field.state.meta.errors.join(", ")}
              </em>
            ) : null}
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isTouched, state.isSubmitting]}>
        {([canSubmit, isTouched, isSubmitting]) => (
          <Button
            type='submit'
            disabled={!canSubmit || !isTouched || mutation.isPending}
            aria-label='submit button'
          >
            {isSubmitting || mutation.isPending ? (
              <LuLoader2 className='animate-spin' />
            ) : (
              <LuSend />
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}