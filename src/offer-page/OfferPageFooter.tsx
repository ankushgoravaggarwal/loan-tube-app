import React from 'react';
import '../styles/OfferPageFooter.css';
import { usePartner } from '../partner/PartnerContext';

const OfferPageFooter: React.FC = () => {
  const { partner } = usePartner();
  const hasPartnerFooterLinks = partner?.footer_links && partner.footer_links.length > 0;
  const hasPartnerFooterInfo = partner?.footer_info && partner.footer_info.trim().length > 0;

  return (
    <footer className="offer-footer">
      <div className="offer-footer-content">
        {/* Partner-specific footer info section */}
        {hasPartnerFooterInfo && (
          <div className="offer-partner-footer-info" dangerouslySetInnerHTML={{ __html: partner!.footer_info! }} />
        )}

        {/* Show default footer info only when partner doesn't have custom footer info */}
        {!hasPartnerFooterInfo && (
          <div className="offer-footer-legal">
            <p>LoanTube is a trading name of Tiger Lion Financial Limited.</p>
            <p>
              Tiger Lion Financial Limited is registered in England & Wales under company number <a href="https://find-and-update.company-information.service.gov.uk/company/10189367" target="_blank" rel="noopener noreferrer" className="offer-footer-link">10189367</a>.
            </p>
            <p>Registered Office: 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ</p>
            <p>
              Tiger Lion Financial Limited is authorised and regulated by the Financial Conduct Authority (FCA).
            </p>
            <p>
              FCA Firm Reference Number: <a href="https://register.fca.org.uk/s/firm?id=001b000003RFLpvAAH" target="_blank" rel="noopener noreferrer" className="offer-footer-link">753151</a>
            </p>
            <p>
              Information Commissioner's Office (ICO) Registration Number: <a href="https://ico.org.uk/ESDWebPages/Entry/ZA185613" target="_blank" rel="noopener noreferrer" className="offer-footer-link">ZA185613</a>
            </p>
            <p className="offer-footer-highlight">LoanTube is as a credit broker, not a lender.</p>
            <p>The rate you are offered will depend on your individual circumstances. <strong>All loans are subject to status.</strong></p>
            
            <div className="offer-footer-example">
              <strong>Representative APR Example</strong>
              <br></br>On an assumed loan amount of £1,000 over 18 months:
              <ul className="offer-footer-list">
              <li>Rate of interest: 59.97% per annum (fixed)</li>
                <li><b>Representative APR: 79.5%</b></li>
                <li>Total amount payable: £1,560.49 (of which £560.49 is interest)</li>
                <li>17 monthly repayments of £86.79, with a final repayment of £85.06</li>
              </ul>
              <p>APR rates start from 18.22%, with a maximum APR of 770%. You will receive a personalised rate based on your circumstances.</p>
            </div>
            
            <p className="offer-footer-warning"><b>Warning:</b> Late repayments can cause serious money problems. For help, visit <a href="https://moneyhelper.org.uk" className="offer-footer-link" target="_blank" rel="noopener noreferrer">moneyhelper.org.uk</a>.</p>
            
            <p>
              LoanTube connects applicants with various lenders and providers of loans, credit cards, credit lines, and other financial products based on their requirements and circumstances. 
              Our broker service is free for customers; however, <b>we receive a commission from lenders and providers</b> for facilitating these connections, which may, in some cases, affect the cost of the loan or other credit products.
            </p>
            
            <p>LoanTube <b>does not cover the entire market</b>, meaning other products may be available to you.</p>
            
            <p>Applicants must be UK residents and at least 18 years old.</p>
            
            <p>All offered quotes are subject to final checks by the lenders and providers.</p>
            
            <p className="offer-footer-securenote">
              Think carefully before securing debts against your home or assets. Your home and assets may be repossessed if you fail to keep up repayments on any debt secured against them.
            </p>
          </div>
        )}
        
        {/* Default LoanTube footer links */}
        <div className="offer-footer-links">
          <a href="https://www.loantube.com/cookies-policy/" target="_blank" rel="noopener noreferrer" className="offer-footer-policy-link">Cookies Policy</a> | 
          <a href="https://www.loantube.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="offer-footer-policy-link">Privacy Policy</a> | 
          <a href="https://www.loantube.com/terms-and-conditions/" target="_blank" rel="noopener noreferrer" className="offer-footer-policy-link">Terms and Conditions</a> | 
          <a href="https://www.loantube.com/complaints-policy/" target="_blank" rel="noopener noreferrer" className="offer-footer-policy-link">Complaints Policy</a> | 
          <a href="https://www.loantube.com/treating-customers-fairly/" target="_blank" rel="noopener noreferrer" className="offer-footer-policy-link">Treating Customers Fairly</a> |
          <a href="https://www.loantube.com/our-partners/" target="_blank" rel="noopener noreferrer" className="offer-footer-policy-link">Our Partners</a>
        </div>
        
        {/* Partner-specific footer links section with separator */}
        {hasPartnerFooterLinks && (
          <>
            <div className="offer-footer-separator"></div>
            <div className="offer-footer-links offer-partner-footer-links">
              {partner!.footer_links!.map((link, index) => (
                <React.Fragment key={link.id}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="offer-footer-policy-link"
                  >
                    {link.text}
                  </a>
                  {index < partner!.footer_links!.length - 1 && " | "}
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </div>
    </footer>
  );
};

export default OfferPageFooter; 