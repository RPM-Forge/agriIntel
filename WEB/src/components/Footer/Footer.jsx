import React from 'react';
import {
  Sprout,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  ExternalLink,
} from 'lucide-react';
import './Footer.css';

const footerColumns = [
  {
    heading: 'Platform',
    links: [
      { label: 'Market Intelligence', href: '#market-intelligence' },
      { label: 'Buyers', href: '#buyers' },
      { label: 'Lot Creation', href: '#lot-creation' },
      { label: 'Logistics', href: '#logistics' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'API Documentation', href: '#', external: true },
      { label: 'Farmer Guides', href: '#' },
      { label: 'Support', href: '#support' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
];

const socialLinks = [
  { icon: Twitter, label: 'Twitter' },
  { icon: Facebook, label: 'Facebook' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'YouTube' },
];

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="footer__container">
        <div className="footer__brand-row">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-icon">
                <Sprout size={24} />
              </span>
              <span className="footer__logo-text">Agri Intel</span>
            </div>
            <p className="footer__description">
              A Smart India Hackathon project empowering farmers through market
              intelligence and digital trade enablement.
            </p>
          </div>
          <div className="footer__contact">
            <a href="mailto:support@agriintel.in" className="footer__contact-item">
              <Mail size={16} />
              <span>support@agriintel.in</span>
            </a>
            <a href="tel:+911800XXXXXXX" className="footer__contact-item">
              <Phone size={16} />
              <span>+91 1800-XXX-XXXX</span>
            </a>
          </div>
        </div>

        <div className="footer__columns">
          {footerColumns.map((column) => (
            <div className="footer__column" key={column.heading}>
              <h4 className="footer__heading">{column.heading}</h4>
              <ul className="footer__links">
                {column.links.map((link) => (
                  <li key={link.label} className="footer__link-item">
                    <a href={link.href} className="footer__link">
                      {link.external && <ExternalLink size={14} />}
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer__column">
            <h4 className="footer__heading">Connect</h4>
            <div className="footer__social">
              {socialLinks.map(({ icon: Icon, label }) => (
                <a key={label} href="#" className="footer__social-link" aria-label={label}>
                  <Icon size={18} />
                </a>
              ))}
            </div>
            <div className="footer__sih-badge">
              <MapPin size={14} />
              <span>Smart India Hackathon 2026 | SIH Project Demo</span>
            </div>
          </div>
        </div>

        <div className="footer__divider" />

        <div className="footer__bottom">
          <p className="footer__copyright">
            © 2026 Agri Intel. An SIH Project. Built for Indian Farmers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;