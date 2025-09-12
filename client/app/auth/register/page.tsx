"use client";

import { useState } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { EyeIcon } from "@/components/icons";
import { AutoHubLogo } from "@/components/AutoHubLogo";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        router.push('/auth/login?message=Registration successful! Please sign in.');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-luxury relative overflow-hidden py-8">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(225,6,0,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,209,102,0.1),transparent_50%)]"></div>
      
      <div className="relative z-10 w-full max-w-lg p-6">
        <Card className="bg-autohub-neutral-50/95 dark:bg-autohub-secondary-800/95 backdrop-blur-md border border-autohub-accent1-300/50 shadow-luxury">
          <CardHeader className="pb-0 pt-8 px-8 flex-col items-center">
            <div className="flex items-center gap-3 mb-6">
              <AutoHubLogo size={40} />
              <div>
                <h1 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">AutoHub</h1>
                <p className="text-sm text-autohub-accent2-600">Premium Automotive</p>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-autohub-secondary-900 dark:text-autohub-neutral-50">Join AutoHub</h2>
              <p className="text-autohub-accent1-600 mt-2">Create your premium account</p>
            </div>
          </CardHeader>
          <CardBody className="overflow-hidden px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-autohub-primary-50 border-l-4 border-autohub-primary-500 text-autohub-primary-700 px-4 py-3 rounded">
                  <p className="font-medium">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  label="First Name"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  variant="bordered"
                  classNames={{
                    inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                    input: "text-autohub-secondary-900 placeholder:text-autohub-accent1-500",
                    label: "text-autohub-accent1-700 font-medium",
                  }}
                />
                <Input
                  type="text"
                  label="Last Name"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  variant="bordered"
                  classNames={{
                    inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                    input: "text-autohub-secondary-900 placeholder:text-autohub-accent1-500",
                    label: "text-autohub-accent1-700 font-medium",
                  }}
                />
              </div>
              
              <Input
                type="email"
                label="Email Address"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                variant="bordered"
                classNames={{
                  inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                  input: "text-autohub-secondary-900 placeholder:text-autohub-accent1-500",
                  label: "text-autohub-accent1-700 font-medium",
                }}
              />
              
              <Input
                type={isPasswordVisible ? "text" : "password"}
                label="Password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                variant="bordered"
                classNames={{
                  inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                  input: "text-autohub-secondary-900 placeholder:text-autohub-accent1-500",
                  label: "text-autohub-accent1-700 font-medium",
                }}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <EyeIcon className="text-2xl text-autohub-accent1-500 pointer-events-none hover:text-autohub-primary-500 transition-colors" />
                  </button>
                }
              />
              
              <Input
                type={isConfirmPasswordVisible ? "text" : "password"}
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                variant="bordered"
                classNames={{
                  inputWrapper: "border-autohub-accent1-300 focus-within:border-autohub-primary-500 hover:border-autohub-primary-500/70",
                  input: "text-autohub-secondary-900 placeholder:text-autohub-accent1-500",
                  label: "text-autohub-accent1-700 font-medium",
                }}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  >
                    <EyeIcon className="text-2xl text-autohub-accent1-500 pointer-events-none hover:text-autohub-primary-500 transition-colors" />
                  </button>
                }
              />
              
              <Button
                type="submit"
                className="w-full bg-autohub-primary-500 hover:bg-autohub-primary-600 text-white font-semibold shadow-autohub transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create AutoHub Account'}
              </Button>
              
              <div className="text-center pt-4">
                <span className="text-autohub-accent1-600">
                  Already have an account?{' '}
                  <Link 
                    href="/auth/login" 
                    size="sm"
                    className="text-autohub-primary-500 hover:text-autohub-primary-600 font-semibold transition-colors"
                  >
                    Sign In
                  </Link>
                </span>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}