// Static info pages (About, Contact, FAQ, Privacy, Terms, Warranty, Returns, Delivery, Support)
'use client';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BUSINESS } from '@/lib/config';
import { Phone, Mail, MapPin, Clock, MessageCircle, Truck, Shield, RotateCcw, FileText, HelpCircle } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">আমাদের সম্পর্কে</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-foreground/80">
        <p>
          <strong>{BUSINESS.name}</strong> বাংলাদেশের একটি প্রিমিয়াম টেকনোলজি রিটেইল প্রতিষ্ঠান। আমরা {BUSINESS.address.line1}-এ অবস্থিত আমাদের দুটি দোকান (Shop 104 এবং 105) থেকে সারা দেশে ল্যাপটপ, ডেস্কটপ পিসি, গেমিং রিগ, কম্পিউটার কম্পোনেন্টস, মনিটর, নেটওয়ার্কিং ইকুইপমেন্ট এবং সকল ধরনের টেক প্রোডাক্ট সরবরাহ করি।
        </p>
        <p>
          আমাদের বিশেষত্ব হলো প্রিমিয়াম কোয়ালিটির রিফারবিশড এবং ইউজড ল্যাপটপ (HP EliteBook, Dell Latitude, Lenovo ThinkPad), ব্র্যান্ড নিউ ল্যাপটপ (Apple MacBook, Microsoft Surface, ASUS, Acer, MSI), গেমিং ল্যাপটপ এবং কাস্টম পিসি বিল্ড। প্রতিটি প্রোডাক্ট কাজের আগে টেস্টেড এবং ভেরিফাইড।
        </p>
        <p>
          আমাদের লক্ষ্য হলো বাংলাদেশের ক্রেতাদের জন্য ১০০% অরিজিনাল প্রোডাক্ট নিশ্চিত করা, অথেন্টিক ওয়ারেন্টি প্রদান করা এবং প্রতিযোগিতামূলক দামে টেক প্রোডাক্ট সরবরাহ করা। আমরা শুধু প্রোডাক্ট বিক্রি করি না, আমরা আমাদের ক্রেতাদের সঠিক টেকনিক্যাল সাপোর্ট ও পরামর্শ দিয়ে সাহায্য করি। কাজের আগে ভিডিও কলে প্রোডাক্ট দেখে নিশ্চিত হতে পারেন।
        </p>
        <h3 className="font-semibold text-lg pt-2">আমাদের সেবাসমূহ</h3>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>প্রিমিয়াম ইউজড ও রিফারবিশড ল্যাপটপ (HP EliteBook, Dell Latitude, Lenovo ThinkPad)</li>
          <li>ব্র্যান্ড নিউ ল্যাপটপ (Apple MacBook, Microsoft Surface, ASUS, Acer, MSI)</li>
          <li>গেমিং ও গ্রাফিক্স ল্যাপটপ</li>
          <li>2-in-1 ও x360 কনভার্টিবল ল্যাপটপ</li>
          <li>অফিস, ফ্রিল্যান্সিং ও বিজনেসের জন্য কাস্টম পিসি বিল্ড</li>
          <li>কম্পিউটার কম্পোনেন্টস ও পেরিফেরালস</li>
          <li>নেটওয়ার্কিং ইকুইপমেন্ট ও আইটি সলিউশন</li>
          <li>অথেন্টিক ওয়ারেন্টি সাপোর্ট (১৫ দিন রিপ্লেসমেন্ট, ৫ বছর সার্ভিস)</li>
          <li>ভিডিও কল সাপোর্ট - কিনার আগে লাইভ দেখুন</li>
          <li>সারা বাংলাদেশে দ্রুত ডেলিভারি</li>
        </ul>
        <h3 className="font-semibold text-lg pt-2">আমাদের প্রতিশ্রুতি</h3>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>প্রতিটি প্রোডাক্ট কাজের আগে টেস্টেড</li>
          <li>১৫ দিনের রিপ্লেসমেন্ট ওয়ারেন্টি (ইউজড ল্যাপটপে)</li>
          <li>৩০ দিনের রিপ্লেসমেন্ট (ওপেন বক্স ল্যাপটপে)</li>
          <li>৫ বছরের সার্ভিস সাপোর্ট</li>
          <li>১০০% অরিজিনাল প্রোডাক্ট গ্যারান্টি</li>
          <li>ক্যাশ অন ডেলিভারি সুবিধা</li>
        </ul>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        {[
          { icon: Shield, title: '১০০% অরিজিনাল', desc: 'অথেন্টিক প্রোডাক্ট' },
          { icon: Truck, title: 'সারা দেশে ডেলিভারি', desc: 'দ্রুত ও নিরাপদ' },
          { icon: Clock, title: BUSINESS.hours.bn, desc: BUSINESS.hours.days },
        ].map((s, i) => (
          <Card key={i} className="p-4 text-center">
            <s.icon className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="font-semibold text-sm">{s.title}</div>
            <div className="text-xs text-muted-foreground">{s.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ContactPage() {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">যোগাযোগ করুন</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">আমাদের ঠিকানা</h3>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">{BUSINESS.name}</div>
              <div className="text-muted-foreground">{BUSINESS.address.line1}</div>
              <div className="text-muted-foreground">{BUSINESS.address.line2}</div>
              <div className="text-muted-foreground">{BUSINESS.address.city} {BUSINESS.address.postalCode}, {BUSINESS.address.country}</div>
            </div>
          </div>

          {/* Multiple phone numbers */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">WhatsApp (প্রাথমিক)</div>
                <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary">{BUSINESS.phone}</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Shop 104</div>
                <a href={`tel:${BUSINESS.phoneAlternate}`} className="text-sm font-medium hover:text-primary">{BUSINESS.phoneAlternate}</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Shop 105</div>
                <a href={`tel:${BUSINESS.phoneAlternate2}`} className="text-sm font-medium hover:text-primary">{BUSINESS.phoneAlternate2}</a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">ইমেইল</div>
              <a href={`mailto:${BUSINESS.email}`} className="text-sm font-medium hover:text-primary">{BUSINESS.email}</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">খোলা থাকে</div>
              <div className="text-sm font-medium">{BUSINESS.hours.bn}</div>
              <div className="text-xs text-muted-foreground">{BUSINESS.hours.days}</div>
            </div>
          </div>

          {/* Facebook link */}
          <a href={BUSINESS.social.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition">
            <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <div>
              <div className="text-sm font-medium text-blue-900">Facebook পেজ</div>
              <div className="text-xs text-blue-700">{BUSINESS.social.facebookFollowers}+ ফলোয়ার · মেসেজ করুন</div>
            </div>
          </a>

          <Button className="w-full gap-2" onClick={() => window.open(`https://wa.me/${BUSINESS.whatsapp}`)}>
            <MessageCircle className="h-4 w-4" /> WhatsApp এ মেসেজ করুন
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate({ name: 'support' })}>
            সাপোর্ট টিকিট খুলুন
          </Button>
        </Card>
        <Card className="p-6 bg-secondary/30">
          <h3 className="font-semibold mb-3">ম্যাপ লোকেশন</h3>
          <div className="aspect-square bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
            <iframe
              title="Shop Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.962!2d90.3929!3d23.7337!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDQ0JzAxLjMiTiA5MMKwMjMnMzQuNSJF!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Suvastu Arcade (ICT Bhaban), Level 1, Shop 104 & 105<br />
            New Elephant Road, Dhaka 1205
          </p>
        </Card>
      </div>
    </div>
  );
}

export function FaqPage() {
  const faqs = [
    { q: 'আপনারা কি সারা বাংলাদেশে ডেলিভারি দেন?', a: 'হ্যাঁ, আমরা সারা বাংলাদেশে কুরিয়ার সার্ভিসের মাধ্যমে ডেলিভারি দিয়ে থাকি। ঢাকায় সাধারণত ২৪-৪৮ ঘন্টা এবং ঢাকার বাইরে ৩-৫ কর্মদিবস সময় লাগে।' },
    { q: 'প্রোডাক্টের ওয়ারেন্টি কেমন?', a: 'আমরা শুধুমাত্র অরিজিনাল প্রোডাক্ট বিক্রি করি যেগুলোর ম্যানুফ্যাকচারার ওয়ারেন্টি থাকে। প্রতিটি প্রোডাক্টের ওয়ারেন্টি পিরিয়ড ভিন্ন হতে পারে, যা প্রোডাক্ট পেজে উল্লেখ থাকে।' },
    { q: 'কি কি পেমেন্ট মেথড গ্রহণযোগ্য?', a: 'আমরা ক্যাশ, বিকাশ, নগদ, রকেট, ব্যাংক ট্রান্সফার এবং কার্ড পেমেন্ট গ্রহণ করি। অনলাইন অর্ডারের ক্ষেত্রে অর্ডার নিশ্চিত হওয়ার পর আমাদের প্রতিনিধি পেমেন্ট নিশ্চিত করতে যোগাযোগ করবেন।' },
    { q: 'প্রোডাক্ট রিটার্ন করার নিয়ম কি?', a: 'ডেলিভারির ৭ দিনের মধ্যে ডিফেক্টিভ প্রোডাক্ট রিটার্ন করা যায়। প্রোডাক্ট অবশ্যই অরিজিনাল প্যাকেজিং সহ এবং ব্যবহার না করা অবস্থায় থাকতে হবে।' },
    { q: 'কাস্টম পিসি বিল্ড করতে পারব?', a: 'হ্যাঁ, আমাদের PC Configurator ব্যবহার করে আপনি নিজের পছন্দমতো কম্পোনেন্ট সিলেক্ট করে কাস্টম পিসি বিল্ড করতে পারবেন। আমরা কম্পোনেন্ট কম্প্যাটিবিলিটি চেক করে দিয়ে ফ্রি অ্যাসেম্বলি করে দিই।' },
    { q: 'EMI সুবিধা আছে কি?', a: 'নির্দিষ্ট প্রোডাক্টের ক্ষেত্রে EMI সুবিধা প্রযোজ্য। বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।' },
  ];
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-6">
        <HelpCircle className="h-10 w-10 mx-auto text-primary mb-2" />
        <h1 className="text-3xl font-bold">সাধারণ জিজ্ঞাসা</h1>
        <p className="text-muted-foreground text-sm mt-1">সাধারণ প্রশ্নের উত্তর</p>
      </div>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <Card key={i} className="p-5">
            <h3 className="font-semibold mb-2">{f.q}</h3>
            <p className="text-sm text-muted-foreground">{f.a}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">প্রাইভেসি পলিসি</h1>
      <Card className="p-6 prose prose-sm max-w-none">
        <p>{BUSINESS.name} আপনার প্রাইভেসি সম্মান করে। এই পলিসি ব্যাখ্যা করে আমরা কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত করি।</p>
        <h3 className="font-semibold">তথ্য সংগ্রহ</h3>
        <p>আমরা অর্ডার প্রসেসিং, ডেলিভারি এবং কাস্টমার সাপোর্টের জন্য আপনার নাম, ফোন নম্বর, ইমেইল এবং ঠিকানা সংগ্রহ করি।</p>
        <h3 className="font-semibold">তথ্য ব্যবহার</h3>
        <p>আপনার তথ্য শুধুমাত্র অর্ডার প্রসেসিং, ডেলিভারি, সাপোর্ট এবং আপনার অনুমতি থাকলে মার্কেটিং কমিউনিকেশনের জন্য ব্যবহার করা হয়।</p>
        <h3 className="font-semibold">তথ্য সুরক্ষা</h3>
        <p>আমরা আপনার তথ্য এনক্রিপ্ট করে সংরক্ষণ করি এবং অনুমোদিত কর্মী ছাড়া অন্য কারও কাছে তথ্য শেয়ার করি না।</p>
        <h3 className="font-semibold">আপনার অধিকার</h3>
        <p>আপনি যেকোনো সময় আপনার তথ্য দেখতে, সংশোধন করতে বা মুছতে অনুরোধ করতে পারেন। এর জন্য {BUSINESS.email}-এ যোগাযোগ করুন।</p>
      </Card>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">শর্তাবলী</h1>
      <Card className="p-6 prose prose-sm max-w-none">
        <p>{BUSINESS.name} থেকে প্রোডাক্ট অর্ডার করে আপনি নিম্নলিখিত শর্তাবলীতে সম্মত হচ্ছেন:</p>
        <h3 className="font-semibold">অর্ডার ও পেমেন্ট</h3>
        <p>অর্ডার নিশ্চিত হওয়ার পর পেমেন্ট সম্পন্ন হতে হবে। পেমেন্ট না হলে অর্ডার বাতিল হতে পারে।</p>
        <h3 className="font-semibold">ডেলিভারি</h3>
        <p>ঢাকায় ২৪-৪৮ ঘন্টা এবং সারা দেশে ৩-৫ কর্মদিবসে ডেলিভারি দেওয়া হয়। কুরিয়ার চার্জ লোকেশন অনুযায়ী প্রযোজ্য।</p>
        <h3 className="font-semibold">ওয়ারেন্টি</h3>
        <p>প্রোডাক্টের ওয়ারেন্টি ম্যানুফ্যাকচারার দিয়ে থাকেন। ওয়ারেন্টি ক্লেমের জন্য ইনভয়েস প্রয়োজন।</p>
        <h3 className="font-semibold">রিটার্ন ও রিফান্ড</h3>
        <p>ডিফেক্টিভ প্রোডাক্ট ডেলিভারির ৭ দিনের মধ্যে রিটার্ন করা যায়। রিফান্ড পেমেন্ট মেথড অনুযায়ী ৭-১৪ কর্মদিবসে প্রসেস হয়।</p>
        <h3 className="font-semibold">দায়িত্ব সীমিতকরণ</h3>
        <p>{BUSINESS.name} প্রোডাক্টের ম্যানুফ্যাকচারিং ডিফেক্টের জন্য ম্যানুফ্যাকচারারের ওয়ারেন্টি পলিসি অনুসরণ করে।</p>
      </Card>
    </div>
  );
}

export function WarrantyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">ওয়ারেন্টি তথ্য</h1>
      </div>
      <Card className="p-6 prose prose-sm max-w-none">
        <p>আমরা শুধুমাত্র অরিজিনাল প্রোডাক্ট বিক্রি করি যেগুলোর ম্যানুফ্যাকচারার ওয়ারেন্টি থাকে। প্রতিটি প্রোডাক্টের ওয়ারেন্টি পিরিয়ড ভিন্ন।</p>
        <h3 className="font-semibold">ওয়ারেন্টি কভারেজ</h3>
        <ul className="list-disc pl-6">
          <li>ম্যানুফ্যাকচারিং ডিফেক্ট</li>
          <li>হার্ডওয়্যার সমস্যা (স্বাভাবিক ব্যবহারে)</li>
          <li>কম্পোনেন্ট ফেইলিওর</li>
        </ul>
        <h3 className="font-semibold">ওয়ারেন্টি বাতিল হয়</h3>
        <ul className="list-disc pl-6">
          <li>শারীরিক ক্ষতি (পড়ে যাওয়া, আঘাত)</li>
          <li>পানি বা তরল পদার্থের ক্ষতি</li>
          <li>অননুমোদিত রিপেয়ার বা মোডিফিকেশন</li>
          <li>সার্জ বা ভোল্টেজ সমস্যা</li>
        </ul>
        <h3 className="font-semibold">ক্লেম করার প্রক্রিয়া</h3>
        <p>ওয়ারেন্টি ক্লেম করতে আমাদের দোকানে ইনভয়েস সহ আসুন অথবা সাপোর্ট টিকিট খুলুন।</p>
      </Card>
    </div>
  );
}

export function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <RotateCcw className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">রিটার্ন ও রিফান্ড পলিসি</h1>
      </div>
      <Card className="p-6 prose prose-sm max-w-none">
        <h3 className="font-semibold">রিটার্ন শর্তাবলী</h3>
        <ul className="list-disc pl-6">
          <li>ডেলিভারির ৭ দিনের মধ্যে রিটার্ন করা যাবে</li>
          <li>প্রোডাক্ট অবশ্যই অরিজিনাল প্যাকেজিং সহ হতে হবে</li>
          <li>সকল এক্সেসরিজ ও ম্যানুয়াল থাকতে হবে</li>
          <li>ব্যবহারের চিহ্ন থাকলে রিটার্ন গ্রহণযোগ্য নয়</li>
        </ul>
        <h3 className="font-semibold">রিফান্ড প্রক্রিয়া</h3>
        <p>রিটার্ন গ্রহণ করা হলে রিফান্ড মূল পেমেন্ট মেথডে ৭-১৪ কর্মদিবসে প্রসেস করা হয়।</p>
        <h3 className="font-semibold">রিটার্ন চার্জ</h3>
        <p>ডিফেক্টিভ প্রোডাক্টের ক্ষেত্রে কোনো চার্জ প্রযোজ্য নয়। ক্রেতার পছন্দ পরিবর্তনের ক্ষেত্রে শিপিং চার্জ প্রযোজ্য।</p>
      </Card>
    </div>
  );
}

export function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <Truck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">ডেলিভারি তথ্য</h1>
      </div>
      <Card className="p-6 prose prose-sm max-w-none">
        <h3 className="font-semibold">ডেলিভারি সময়</h3>
        <ul className="list-disc pl-6">
          <li>ঢাকা শহরে: ২৪-৪৮ ঘন্টা</li>
          <li>ঢাকার বাইরে: ৩-৫ কর্মদিবস</li>
          <li>শনি-রবিবারের অর্ডার পরবর্তী কর্মদিবসে প্রসেস হয়</li>
        </ul>
        <h3 className="font-semibold">ডেলিভারি চার্জ</h3>
        <ul className="list-disc pl-6">
          <li>ঢাকা শহরে: ৬০-১০০ টাকা</li>
          <li>ঢাকার বাইরে: ১০০-১৫০ টাকা</li>
          <li>নির্দিষ্ট পরিমাণের অর্ডারে ফ্রি ডেলিভারি প্রযোজ্য</li>
        </ul>
        <h3 className="font-semibold">কুরিয়ার পার্টনার</h3>
        <p>আমরা বিশ্বস্ত কুরিয়ার সার্ভিস ব্যবহার করি যেমন Steadfast, Pathao, RedX ইত্যাদি। অর্ডার ডিসপ্যাচ হলে ট্র্যাকিং নম্বর প্রদান করা হয়।</p>
      </Card>
    </div>
  );
}

export function SupportPage() {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">কাস্টমার সাপোর্ট</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <MessageCircle className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-2">WhatsApp সাপোর্ট</h3>
          <p className="text-sm text-muted-foreground mb-3">দ্রুত সাপোর্টের জন্য WhatsApp এ মেসেজ করুন</p>
          <Button variant="outline" onClick={() => window.open(`https://wa.me/${BUSINESS.whatsapp}`)} className="w-full">
            {BUSINESS.phone}
          </Button>
        </Card>
        <Card className="p-6">
          <Phone className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-2">ফোন সাপোর্ট</h3>
          <p className="text-sm text-muted-foreground mb-3">বৃহস্পতি-শনি, ১০AM-৮PM</p>
          <a href={`tel:${BUSINESS.phone}`}>
            <Button variant="outline" className="w-full">{BUSINESS.phone}</Button>
          </a>
        </Card>
        <Card className="p-6">
          <Mail className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-2">ইমেইল সাপোর্ট</h3>
          <p className="text-sm text-muted-foreground mb-3">২৪ ঘন্টার মধ্যে রিপ্লাই পাবেন</p>
          <a href={`mailto:${BUSINESS.email}`}>
            <Button variant="outline" className="w-full">{BUSINESS.email}</Button>
          </a>
        </Card>
        <Card className="p-6">
          <FileText className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-2">সাপোর্ট টিকিট</h3>
          <p className="text-sm text-muted-foreground mb-3">বিস্তারিত সমস্যার জন্য টিকিট খুলুন</p>
          <Button className="w-full" onClick={() => navigate({ name: 'customer-auth' })}>টিকিট খুলুন</Button>
        </Card>
      </div>
    </div>
  );
}

export function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
      <h1 className="text-3xl font-bold mb-4">ব্লগ ও বাইং গাইড</h1>
      <Card className="p-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h3 className="font-semibold mb-2">শীঘ্রই আসছে</h3>
        <p className="text-sm text-muted-foreground">আমাদের ব্লগ সেকশন আসছে শীঘ্রই। টেক টিপস, বাইং গাইড এবং প্রোডাক্ট রিভিউ পাবেন এখানে।</p>
      </Card>
    </div>
  );
}
