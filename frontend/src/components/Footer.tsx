import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      { name: "Médicaments", href: "#" },
      { name: "Dispositifs Médicaux", href: "#" },
      { name: "Cosmétiques", href: "#" },
      { name: "Compléments Alimentaires", href: "#" },
    ],
    ressources: [
      { name: "Textes Réglementaires", href: "#" },
      { name: "Formulaires", href: "#" },
      { name: "Tarification", href: "#" },
      { name: "FAQ", href: "#" },
    ],
    liens: [
      { name: "Ministère de la Santé", href: "#", external: true },
      { name: "CNSS", href: "#", external: true },
      { name: "Pharmacie.ma", href: "#", external: true },
    ],
  };

  return (
    <footer id="contact" className="bg-foreground text-background">
      <div className="container-gov py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">A</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">AMMPS</h3>
                <p className="text-xs text-background/60">Agence Marocaine des Médicaments et Produits de Santé</p>
              </div>
            </div>
            <p className="text-sm text-background/70 mb-6 max-w-sm">
              Plateforme officielle de dématérialisation des procédures réglementaires 
              pour les produits de santé au Maroc.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a href="tel:+212537000000" className="flex items-center gap-3 text-sm text-background/70 hover:text-secondary transition-colors">
                <Phone className="w-4 h-4" />
                +212 5 37 00 00 00
              </a>
              <a href="mailto:contact@ammps.gov.ma" className="flex items-center gap-3 text-sm text-background/70 hover:text-secondary transition-colors">
                <Mail className="w-4 h-4" />
                contact@ammps.gov.ma
              </a>
              <div className="flex items-start gap-3 text-sm text-background/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Avenue Moulay Rachid, Rabat, Maroc</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-background/70 hover:text-secondary transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Ressources</h4>
            <ul className="space-y-3">
              {footerLinks.ressources.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-background/70 hover:text-secondary transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens Utiles */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Liens Utiles</h4>
            <ul className="space-y-3">
              {footerLinks.liens.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="flex items-center gap-1 text-sm text-background/70 hover:text-secondary transition-colors"
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                  >
                    {link.name}
                    {link.external && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container-gov py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/60">
            <p>© {currentYear} AMMPS - Tous droits réservés</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-secondary transition-colors">Mentions Légales</a>
              <a href="#" className="hover:text-secondary transition-colors">Politique de Confidentialité</a>
              <a href="#" className="hover:text-secondary transition-colors">Accessibilité</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
