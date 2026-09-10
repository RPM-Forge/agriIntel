import React, { useState, useEffect, useCallback } from "react";
import { Sprout, Menu, X, LogIn, ChevronRight } from "lucide-react";
import "./Navbar.css";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Market Intelligence", href: "#market-intelligence" },
  { label: "Buyers", href: "#buyers" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#impact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);

    const sections = navLinks.map((link) => link.href.replace("#", ""));
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = document.getElementById(sections[i]);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 120) {
          setActiveSection(sections[i]);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__container">
        <a
          href="#home"
          className="navbar__logo"
          onClick={(e) => handleNavClick(e, "#home")}
        >
          <Sprout className="navbar__logo-icon" size={28} />
          <span className="navbar__logo-text">Agri Intel</span>
        </a>

        <div className="navbar__links">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`navbar__link ${
                activeSection === link.href.replace("#", "")
                  ? "navbar__link--active"
                  : ""
              }`}
              onClick={(e) => handleNavClick(e, link.href)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="navbar__actions">
          <button className="navbar__login-btn">
            <LogIn size={16} />
            Login
          </button>
          <button className="navbar__cta-btn">
            Get Started
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          className={`navbar__hamburger ${
            isOpen ? "navbar__hamburger--open" : ""
          }`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
        </button>
      </div>

      <div
        className={`navbar__overlay ${isOpen ? "navbar__overlay--open" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`navbar__mobile-menu ${isOpen ? "navbar__mobile-menu--open" : ""}`}>
        <div className="navbar__mobile-menu-inner">
          <div className="navbar__mobile-menu-header">
            <Sprout className="navbar__mobile-logo-icon" size={32} />
            <span className="navbar__mobile-logo-text">Agri Intel</span>
          </div>

          <div className="navbar__mobile-links">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className={`navbar__mobile-link ${
                  activeSection === link.href.replace("#", "")
                    ? "navbar__mobile-link--active"
                    : ""
                }`}
                onClick={(e) => handleNavClick(e, link.href)}
                style={{ transitionDelay: isOpen ? `${0.1 + index * 0.05}s` : "0s" }}
              >
                <span>{link.label}</span>
                <ChevronRight size={18} />
              </a>
            ))}
          </div>

          <div className="navbar__mobile-actions">
            <button
              className="navbar__mobile-login-btn"
              onClick={() => setIsOpen(false)}
            >
              <LogIn size={18} />
              Login
            </button>
            <button
              className="navbar__mobile-cta-btn"
              onClick={() => setIsOpen(false)}
            >
              Get Started
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
