// Facebook Social Proof Banner - shows Facebook page link, followers, latest posts
'use client';
import { BUSINESS } from '@/lib/config';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Facebook, ThumbsUp, MessageCircle, Share2, ExternalLink, Users, Star } from 'lucide-react';

export function FacebookBanner() {
  return (
    <Card className="relative overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl"></div>

      <div className="relative p-6 md:p-8">
        <div className="grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
          {/* Facebook icon */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
              <Facebook className="h-8 w-8" />
            </div>
            <div>
              <div className="font-bold text-lg flex items-center gap-2">
                The Dreamer IT-Express
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <Users className="mr-1 h-2.5 w-2.5" /> {BUSINESS.social.facebookFollowers}+
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">অফিসিয়াল ফেসবুক পেজ · Business Center</div>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs text-muted-foreground ml-1">কাস্টমার রেটিং</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-foreground/80 mb-2">
              আমাদের ফেসবুক পেজ ফলো করুন এবং নতুন প্রোডাক্ট, অফার ও ডিসকাউন্টের আপডেট পান।
              লাইভ প্রোডাক্ট ডেমো, কাস্টমার রিভিউ এবং এক্সক্লুসিভ অফার শুধু ফেসবুকে!
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full">
                <ThumbsUp className="h-3 w-3 text-blue-600" /> লাইক ও ফলো
              </span>
              <span className="flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full">
                <MessageCircle className="h-3 w-3 text-blue-600" /> মেসেজ চ্যাট
              </span>
              <span className="flex items-center gap-1 px-2 py-1 bg-white/60 rounded-full">
                <Share2 className="h-3 w-3 text-blue-600" /> পোস্ট শেয়ার
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2">
            <a href={BUSINESS.social.facebook} target="_blank" rel="noopener noreferrer">
              <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                <Facebook className="h-4 w-4" /> পেজ ভিজিট করুন
              </Button>
            </a>
            <a href={`${BUSINESS.social.facebook}/posts`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                <ExternalLink className="h-3 w-3" /> লেটেস্ট পোস্ট
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
