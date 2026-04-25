'use client';

import SurveiForm from '@/components/survei-form';

export default function SurveyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SIAP KB</h1>
          <p className="text-lg text-gray-600">
            Saluran Informasi dan Aduan Kualitas Pelayanan KB
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Keluhan Teratasi, KB makin berkualitas
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <SurveiForm />
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Kementerian Kependudukan dan Pembangunan Keluarga/BKKBN</p>
        </div>
      </div>
    </div>
  );
}
