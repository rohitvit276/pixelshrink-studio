import React from 'react';
import { Instagram, FileText, Share2, ArrowRight } from 'lucide-react';
import { USER_FAVORITES } from '../mock';

const iconMap = { Instagram, FileText, Share2 };

export default function UserFavorites() {
  return (
    <section id="usecases" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900">User favourites</h2>
          <p className="text-slate-600 mt-2">Top tools chosen by creators like you.</p>
        </div>
        <a href="#" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1">
          Browse all tools <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {USER_FAVORITES.map((card) => {
          const Icon = iconMap[card.icon] || Share2;
          return (
            <a
              key={card.title}
              href="#"
              className={`group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${card.accent} border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all`}
            >
              <div className="w-12 h-12 rounded-xl bg-white grid place-items-center shadow-sm mb-4">
                <Icon className="w-6 h-6 text-slate-800" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">{card.title}</h3>
              <p className="text-sm text-slate-700 mt-1">{card.desc}</p>
              <ArrowRight className="w-5 h-5 absolute bottom-5 right-5 text-slate-800 transition-transform group-hover:translate-x-1" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
