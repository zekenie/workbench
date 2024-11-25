import { ActionFunctionArgs, Form, Link, useNavigate } from "react-router-dom";
import { useSetupAuth } from "../provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backendClient } from "@/backend";
import { useCallback, useEffect } from "react";

// export async function action({ request }: ActionFunctionArgs) {
//   const formData = await request.formData();
//   const email = formData.get("email") as string;
//   const password = formData.get("password") as string;

//   const res = await backendClient.auth.signup.post({
//     email,
//     password,
//   });

//   console.log(res.status, res.data, res.error);
//   return null;
// }

export default function SignupPage() {
  const { signup, isAuthenticated, isLoading } = useSetupAuth();

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      await signup({ email, password });
    },
    [signup]
  );

  const navigate = useNavigate();
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated) {
      navigate("/boards");
    }
  }, [isAuthenticated, isLoading, navigate]);
  return (
    <Form method="post" onSubmit={onSubmit}>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input name="email" id="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input name="password" id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Sign up
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </Form>
  );
}
