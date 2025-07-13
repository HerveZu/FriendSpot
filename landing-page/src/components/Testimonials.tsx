import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Marie Dubois",
    role: "CEO, TechStart",
    image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1",
    content: "AppFlow a révolutionné notre façon de travailler. Nous avons augmenté notre productivité de 300% en seulement 3 mois.",
    rating: 5
  },
  {
    name: "Thomas Martin",
    role: "Directeur Produit, InnovCorp",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1",
    content: "L'interface intuitive et les fonctionnalités avancées font d'AppFlow un outil indispensable pour notre équipe.",
    rating: 5
  },
  {
    name: "Sophie Laurent",
    role: "Lead Designer, CreativeHub",
    image: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1",
    content: "Enfin une solution qui comprend nos besoins créatifs. La collaboration en temps réel est parfaite.",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ils nous font 
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> confiance</span>
          </h2>
          <p className="text-xl text-gray-600">
            Découvrez pourquoi +10,000 entreprises choisissent AppFlow
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-yellow-400 fill-current" />
                ))}
              </div>
              
              <Quote size={24} className="text-blue-500 mb-4" />
              
              <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
              
              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-4 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200">
            <div className="flex -space-x-2">
              {testimonials.map((testimonial, index) => (
                <img 
                  key={index}
                  src={testimonial.image} 
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">+10,000 utilisateurs satisfaits</span>
          </div>
        </div>
      </div>
    </section>
  );
}