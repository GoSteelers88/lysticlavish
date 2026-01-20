'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, ChevronRight, User, Mail, Phone, FileText } from 'lucide-react';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface CustomerInfoFormProps {
  initialData: CustomerInfo;
  onSubmit: (data: CustomerInfo) => void;
  onBack: () => void;
}

export function CustomerInfoForm({
  initialData,
  onSubmit,
  onBack,
}: CustomerInfoFormProps) {
  const [formData, setFormData] = useState<CustomerInfo>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof CustomerInfo]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerInfo, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl text-espresso-900">Your Information</h2>
        <p className="text-espresso-600 mt-2">
          Please provide your contact details so we can confirm your appointment.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso-400">
            <User className="w-5 h-5" />
          </div>
          <Input
            name="name"
            type="text"
            placeholder="Your full name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            className="pl-12"
            autoComplete="name"
          />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso-400">
            <Mail className="w-5 h-5" />
          </div>
          <Input
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            className="pl-12"
            autoComplete="email"
          />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso-400">
            <Phone className="w-5 h-5" />
          </div>
          <Input
            name="phone"
            type="tel"
            placeholder="(123) 456-7890"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
            className="pl-12"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block font-sans text-sm font-medium text-espresso-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Special Requests or Notes (Optional)
          </label>
          <textarea
            name="notes"
            placeholder="Any allergies, preferences, or special requests..."
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className={cn(
              'w-full px-4 py-3 font-sans text-espresso-800',
              'bg-white border-2 border-nude-300 rounded-xl',
              'placeholder:text-nude-500',
              'focus:border-gold-500 focus:ring-0',
              'transition-colors duration-200 resize-none'
            )}
          />
        </div>
      </div>

      {/* Privacy Note */}
      <p className="text-xs text-espresso-500 text-center">
        Your information is secure and will only be used to manage your appointment.
        We'll send appointment confirmations and reminders to your email.
      </p>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </form>
  );
}
