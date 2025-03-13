import Link from 'next/link';
import AnimationContainer from './global/animation-container';
import Wrapper from "./global/wrapper";
import Image from 'next/image';

const PRODUCT_LINKS = [
    { label: "Property Search", href: "#" },
    { label: "Management Tools", href: "#" },
    { label: "Virtual Tours", href: "#" },
    { label: "Market Analytics", href: "#" },
];

const RESOURCES_LINKS = [
    { label: "Knowledge Base", href: "#" },
    { label: "Market Reports", href: "#" },
    { label: "Property Guides", href: "#" },
    { label: "Success Stories", href: "#" },
];

const COMPANY_LINKS = [
    { label: "About Us", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
];

const SOCIAL_LINKS = [
    { 
        name: "Twitter", 
        href: "https://twitter.com/harshitduggal5",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 512 512">
              <g clipPath="url(#clip0_84_15697)">
                <rect width="512" height="512" fill="#000" rx="60"></rect>
                <path fill="#fff" d="M355.904 100H408.832L293.2 232.16L429.232 412H322.72L239.296 302.928L143.84 412H90.8805L214.56 270.64L84.0645 100H193.28L268.688 199.696L355.904 100ZM337.328 380.32H366.656L177.344 130.016H145.872L337.328 380.32Z"></path>
              </g>
              <defs>
                <clipPath id="clip0_84_15697">
                  <rect width="512" height="512" fill="#fff"></rect>
                </clipPath>
              </defs>
            </svg>
        )
    },
    { 
        name: "GitHub", 
        href: "https://github.com/duggal1",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 0c5.523 0 10 4.59 10 10.253 0 4.529-2.862 8.371-6.833 9.728-.507.101-.687-.219-.687-.492 0-.338.012-1.442.012-2.814 0-.956-.32-1.58-.679-1.898 2.227-.254 4.567-1.121 4.567-5.059 0-1.12-.388-2.034-1.03-2.752.104-.259.447-1.302-.098-2.714 0 0-.838-.275-2.747 1.051A9.396 9.396 0 0 0 10 4.958a9.375 9.375 0 0 0-2.503.345C5.586 3.977 4.746 4.252 4.746 4.252c-.543 1.412-.2 2.455-.097 2.714-.639.718-1.03 1.632-1.03 2.752 0 3.928 2.335 4.808 4.556 5.067-.286.256-.545.708-.635 1.371-.57.262-2.018.715-2.91-.852 0 0-.529-.985-1.533-1.057 0 0-.975-.013-.068.623 0 0 .655.315 1.11 1.5 0 0 .587 1.83 3.369 1.21.005.857.014 1.665.014 1.909 0 .271-.184.588-.683.493C2.865 18.627 0 14.783 0 10.253 0 4.59 4.478 0 10 0" />
            </svg>
        )
    },
    { 
        name: "Product Hunt", 
        href: "#",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" id="product">
  <defs>
    <linearGradient id="a" x1="50%" x2="50%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#DA552F"></stop>
      <stop offset="100%" stop-color="#D04B25"></stop>
    </linearGradient>
  </defs>
  <g fill="none" fill-rule="evenodd">
    <path fill="url(#a)" d="M128 256c70.694 0 128-57.306 128-128S198.694 0 128 0 0 57.306 0 128s57.306 128 128 128z"></path>
    <path fill="#FFF" d="M96 76.8v102.4h19.2v-32h29.056c19.296-.512 34.944-16.16 34.944-35.2 0-19.552-15.648-35.2-34.944-35.2H96zm48.493 51.2H115.2V96h29.293c8.563 0 15.507 7.168 15.507 16s-6.944 16-15.507 16z"></path>
  </g>
</svg>

          
        )
    },
    { 
        name: "LinkedIn", 
        href: "https://www.linkedin.com/in/harshit-duggal-138300279/",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" fill="currentColor">
              <rect width="512" height="512" fill="#0077b5" rx="15%" />
              <circle cx="142" cy="138" r="37" fill="#fff" />
              <path stroke="#fff" strokeWidth="66" d="M244 194v198M142 194v198" />
              <path fill="#fff" d="M276 282c0-20 13-40 36-40 24 0 33 18 33 45v105h66V279c0-61-32-89-76-89-34 0-51 19-59 32" />
            </svg>
        )
    }
];

const Footer = () => {
    return (
        <AnimationContainer>
            <footer className="relative bg-gradient-to-b from-background/80 to-background backdrop-blur-sm pt-16 pb-8 border-t border-border/10 w-full overflow-hidden">
                <Wrapper>
                    {/* Subtle background glow */}
                    <div className="-top-40 left-1/2 absolute bg-primary/20 opacity-50 blur-[80px] rounded-full w-1/3 h-40 -translate-x-1/2"></div>
                    
                    {/* Divider line with gradient */}
                    <div className="top-0 absolute bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 mx-auto w-full h-px"></div>
                    
                    <div className="gap-16 grid md:grid-cols-2 lg:grid-cols-4">
                        {/* Brand section */}
                        <div className="flex flex-col space-y-6">
                            <Link href="/" className="inline-flex">
                                <Image src="/logo.png" alt="SynexAI" width={40} height={40} />
                                <span className="ml-3 font-black text-foreground text-3xl">
                                    Synex<span className="text-[rgb(45,52,255)]">AI</span>
                                </span>
                            </Link>
                            
                            <p className="text-muted-foreground text-sm">
                                Modern invoice SaaS for streamlined financial management
                            </p>
                            
                            {/* Social links */}
                            <div className="flex items-center gap-4 mt-2">
                                {SOCIAL_LINKS.map((social, index) => (
                                    <Link
                                        key={index}
                                        href={social.href}
                                        aria-label={social.name}
                                        className="text-muted-foreground hover:text-primary transition-colors duration-200"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <span className="size-5">
                                            {social.icon}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        
                        {/* Product links */}
                        <div>
                            <h3 className="mb-6 font-medium text-foreground text-sm uppercase tracking-wider">Product</h3>
                            <ul className="space-y-4 text-sm">
                                {PRODUCT_LINKS.map((link, index) => (
                                    <li key={index}>
                                        <Link
                                            href={link.href}
                                            className="text-muted-foreground hover:text-primary transition-colors duration-200"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Resources links */}
                        <div>
                            <h3 className="mb-6 font-medium text-foreground text-sm uppercase tracking-wider">Resources</h3>
                            <ul className="space-y-4 text-sm">
                                {RESOURCES_LINKS.map((link, index) => (
                                    <li key={index}>
                                        <Link
                                            href={link.href}
                                            className="text-muted-foreground hover:text-primary transition-colors duration-200"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Company links */}
                        <div>
                            <h3 className="mb-6 font-medium text-foreground text-sm uppercase tracking-wider">Company</h3>
                            <ul className="space-y-4 text-sm">
                                {COMPANY_LINKS.map((link, index) => (
                                    <li key={index}>
                                        <Link
                                            href={link.href}
                                            className="text-muted-foreground hover:text-primary transition-colors duration-200"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    {/* Contact info and copyright */}
                    <div className="flex md:flex-row flex-col justify-between items-center mt-16 pt-8 border-t border-border/10 text-muted-foreground text-sm">
                        <div className="flex md:flex-row flex-col gap-2 md:gap-6 mb-6 md:mb-0 md:text-left text-center">
                            <p>duggal@synexai.in</p>
                            <p>+1 (991) 456-7880</p>
                            <p>123 Pine Avenue, Suite 500, New York, NY 10001</p>
                        </div>
                        <p>© {new Date().getFullYear()} SynexAI. All rights reserved.</p>
                    </div>
                </Wrapper>
            </footer>
        </AnimationContainer>
    );
};

export default Footer;