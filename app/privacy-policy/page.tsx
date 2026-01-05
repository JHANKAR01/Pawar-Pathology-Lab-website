import React from 'react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-clinical-rose to-clinical-rose-dark px-8 py-10 text-white">
                    <h1 className="text-4xl font-black uppercase tracking-tight">Privacy Policy</h1>
                    <p className="text-rose-100 mt-2 font-medium">Effective Date: January 1, 2026</p>
                </div>

                <div className="p-10 space-y-8">
                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">1. Introduction</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Pawar Pathology Lab ("we," "our," or "us") is committed to protecting your privacy.
                            This Privacy Policy explains how we collect, use, and safeguard your personal information,
                            including Sensitive Personal Data or Information (SPDI) related to your health.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">2. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li><strong>Personal Information:</strong> Name, phone number, email address, and physical address.</li>
                            <li><strong>Health Data:</strong> Medical test requests, biological samples, and diagnostic reports.</li>
                            <li><strong>Technical Data:</strong> IP address, browser type, and location data (for home collection services).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">3. How We Use Your Data</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We use your data strictly for:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600 mt-2">
                            <li>Processing diagnostic tests and generating reports.</li>
                            <li>Communicating appointment details and test results.</li>
                            <li>Coordinating home sample collection via our partners.</li>
                            <li>Legal and regulatory compliance.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">4. Data Sharing & Disclosure</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We do not sell your personal data. We may share data with:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600 mt-2">
                            <li><strong>Authorized Partners:</strong> Field phlebotomists for sample collection (strictly on a need-to-know basis).</li>
                            <li><strong>Technology Providers:</strong> Secure cloud storage (e.g., Google Drive) and notification services (e.g., Telegram, Email).</li>
                            <li><strong>Legal Authorities:</strong> If required by law or court order.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">5. Data Security</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We implement industry-standard security measures, including encryption, access controls, and secure data storage,
                            to protect your health information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">6. Your Rights</h2>
                        <p className="text-slate-600 leading-relaxed">
                            You have the right to access, correct, or request deletion of your personal data.
                            Contact us at <a href="mailto:support@pawarlab.com" className="text-clinical-rose font-bold hover:underline">support@pawarlab.com</a> for any grievances.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">7. Contact Us</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Physical Address: Link Road, Civil Lines, Betul, Madhya Pradesh - 460001<br />
                            Phone: +91 9755553339
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
