import React from "react";

const Footer = () => (
  <footer className="bg-gray-100 py-6 mt-10">
    <div className="container mx-auto text-center text-gray-600 text-sm">
      <p>&copy; {new Date().getFullYear()} Ltronix Shop. All rights reserved.</p>
      <div className="mt-2">
        <a href="mailto:info@ltronix.com" className="mx-2 hover:underline">Contact</a>
        <a href="https://twitter.com/ltronix" className="mx-2 hover:underline">Twitter</a>
        <a href="https://facebook.com/ltronix" className="mx-2 hover:underline">Facebook</a>
      </div>
    </div>
  </footer>
);

export default Footer;
