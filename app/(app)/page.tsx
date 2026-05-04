'use client';

import SurveiForm from '@/components/survei-form';

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 md:py-12 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">SIAP KB</h1>
          <p className="text-base md:text-lg text-gray-600">
            Saluran Informasi dan Aduan Kualitas Pelayanan KB
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-2">
            Keluhan Tuntas, KB Makin Berkualitas
          </p>
        </div>

        <SurveiForm />

        <div className="mt-8 text-center text-xs text-gray-500 px-4">
          <p>Kementerian Kependudukan dan Pembangunan Keluarga/BKKBN</p>
        </div>
      </div>
    </div>
  );
}
