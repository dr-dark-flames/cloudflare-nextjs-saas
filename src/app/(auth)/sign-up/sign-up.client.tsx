"use client";

import { signUpAction } from "./sign-up.actions";
import { type SignUpSchema, signUpSchema } from "@/schemas/signup.schema";
import { startPasskeyRegistrationAction, completePasskeyRegistrationAction } from "./passkey.actions";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SeparatorWithText from "@/components/separator-with-text";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useServerAction } from "zsa-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SSOButtons from "../_components/sso-buttons";
import { useState } from "react";
import { z } from "zod";
import { startRegistration } from "@simplewebauthn/browser";
import { LockIcon } from 'lucide-react'

const passkeyEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type PasskeyEmailSchema = z.infer<typeof passkeyEmailSchema>;

const SignUpPage = () => {
  const router = useRouter();
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const { execute: signUp } = useServerAction(signUpAction, {
    onError: (error) => {
      toast.dismiss()
      toast.error(error.err?.message)
    },
    onStart: () => {
      toast.loading("Creating your account...")
    },
    onSuccess: () => {
      toast.dismiss()
      toast.success("Account created successfully")
      router.push("/dashboard")
    }
  })

  const { execute: completePasskeyRegistration } = useServerAction(completePasskeyRegistrationAction, {
    onError: (error) => {
      toast.dismiss()
      toast.error(error.err?.message)
      setIsRegistering(false)
    },
    onSuccess: () => {
      toast.dismiss()
      toast.success("Account created successfully")
      router.push("/dashboard")
    }
  })

  const { execute: startPasskeyRegistration } = useServerAction(startPasskeyRegistrationAction, {
    onError: (error) => {
      toast.dismiss()
      toast.error(error.err?.message)
      setIsRegistering(false)
    },
    onStart: () => {
      toast.loading("Starting passkey registration...")
      setIsRegistering(true)
    },
    onSuccess: async (response) => {
      toast.dismiss()
      if (!response?.data?.optionsJSON) {
        toast.error("Failed to start passkey registration")
        setIsRegistering(false)
        return;
      }

      try {
        const attResp = await startRegistration({
          optionsJSON: response.data.optionsJSON,
          useAutoRegister: true,
        });
        await completePasskeyRegistration({ response: attResp });
      } catch (error: unknown) {
        console.error("Failed to register passkey:", error);
        toast.error("Failed to register passkey")
        setIsRegistering(false)
      }
    }
  })

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });

  const passkeyForm = useForm<PasskeyEmailSchema>({
    resolver: zodResolver(passkeyEmailSchema),
  });

  const onSubmit = async (data: SignUpSchema) => {
    signUp(data)
  }

  const onPasskeySubmit = async (data: PasskeyEmailSchema) => {
    startPasskeyRegistration(data)
  }

  return (
    <div className="min-h-screen flex items-center px-4 justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-6 md:p-10 bg-card rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <h2 className="mt-6 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:text-primary/90 underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          <SSOButtons />

          <Button
            className="w-full"
            onClick={() => setIsPasskeyModalOpen(true)}
          >
            <LockIcon className="w-5 h-5 mr-2" />
            Sign up with a Passkey
          </Button>
        </div>

        <SeparatorWithText>
          <span className="uppercase text-muted-foreground">Or</span>
        </SeparatorWithText>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email address"
                      className="w-full px-3 py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="First Name"
                      className="w-full px-3 py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Last Name"
                      className="w-full px-3 py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Password"
                      className="w-full px-3 py-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full flex justify-center py-2.5"
            >
              Create Account
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="font-medium text-primary hover:text-primary/90 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-primary hover:text-primary/90 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      <Dialog open={isPasskeyModalOpen} onOpenChange={setIsPasskeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign up with a Passkey</DialogTitle>
          </DialogHeader>
          <Form {...passkeyForm}>
            <form onSubmit={passkeyForm.handleSubmit(onPasskeySubmit)} className="space-y-6 mt-6">
              <FormField
                control={passkeyForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email address"
                        className="w-full px-3 py-2"
                        disabled={isRegistering}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isRegistering}>
                {isRegistering ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Registering...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignUpPage;
