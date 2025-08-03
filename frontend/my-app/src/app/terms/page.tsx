// frontend/my-app/src/app/terms/page.tsx
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

export default function TermsOfServicePage() {
  return (
    <Box p={8} maxWidth="800px" margin="auto">
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="xl" textAlign="center" mb={6}>
          Terms of Service
        </Heading>
        <Text fontSize="lg">
          Welcome to ltronix-shop.vercel.app! These terms and conditions outline the rules and regulations for the use of Ltronix Shop's Website, located at ltronix-shop.vercel.app.
        </Text>
        <Text>
          By accessing this website we assume you accept these terms and conditions. Do not continue to use ltronix-shop.vercel.app if you do not agree to take all of the terms and conditions stated on this page.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Cookies
        </Heading>
        <Text>
          We employ the use of cookies. By accessing ltronix-shop.vercel.app, you agreed to use cookies in agreement with the Ltronix Shop's Privacy Policy.
        </Text>
        <Text>
          Most interactive websites use cookies to let us retrieve the user’s details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          License
        </Heading>
        <Text>
          Unless otherwise stated, Ltronix Shop and/or its licensors own the intellectual property rights for all material on ltronix-shop.vercel.app. All intellectual property rights are reserved. You may access this from ltronix-shop.vercel.app for your own personal use subjected to restrictions set in these terms and conditions.
        </Text>
        <Text>
          You must not:
          <VStack pl={4} align="start">
            <Text>- Republish material from ltronix-shop.vercel.app</Text>
            <Text>- Sell, rent or sub-license material from ltronix-shop.vercel.app</Text>
            <Text>- Reproduce, duplicate or copy material from ltronix-shop.vercel.app</Text>
            <Text>- Redistribute content from ltronix-shop.vercel.app</Text>
          </VStack>
        </Text>
        <Text>
          This Agreement shall begin on the date hereof.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Hyperlinking to our Content
        </Heading>
        <Text>
          The following organizations may link to our Website without prior written approval:
          <VStack pl={4} align="start">
            <Text>- Government agencies;</Text>
            <Text>- Search engines;</Text>
            <Text>- News organizations;</Text>
            <Text>- Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of other listed businesses; and</Text>
            <Text>- System wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls, and charity fundraising groups which may not hyperlink to our Web site.</Text>
          </VStack>
        </Text>
        <Text>
          We may consider and approve other link requests from the following types of organizations:
          <VStack pl={4} align="start">
            <Text>- commonly-known consumer and/or business information sources;</Text>
            <Text>- dot.com community sites;</Text>
            <Text>- associations or other groups representing charities;</Text>
            <Text>- online directory distributors;</Text>
            <Text>- internet portals;</Text>
            <Text>- accounting, law and consulting firms; and</Text>
            <Text>- educational institutions and trade associations.</Text>
          </VStack>
        </Text>
        <Text>
          We will approve link requests from these organizations if we decide that: (a) the link would not make us look unfavorably to ourselves or to our accredited businesses; (b) the organization does not have any negative records with us; (c) the benefit to us from the visibility of the hyperlink compensates the absence of Ltronix Shop; and (d) the link is in the context of general resource information.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          iFrames
        </Heading>
        <Text>
          Without prior approval and written permission, you may not create frames around our Webpages that alter in any way the visual presentation or appearance of our Website.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Content Liability
        </Heading>
        <Text>
          We shall not be held responsible for any content that appears on your Website. You agree to protect and defend us against all claims that is rising on your Website. No link(s) should appear on any Website that may be interpreted as libelous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Reservation of Rights
        </Heading>
        <Text>
          We reserve the right to request that you remove all links or any particular link to our Website. You approve to immediately remove all links to our Website upon request. We also reserve the right to amen these terms and conditions and its linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Removal of links from our website
        </Heading>
        <Text>
          If you find any link on our Website that is offensive for any reason, you are free to contact and inform us any moment. We will consider requests to remove links but we are not obligated to or so or to respond to you directly.
        </Text>
        <Text>
          We do not ensure that the information on this website is correct, we do not warrant its completeness or accuracy; nor do we promise to ensure that the website remains available or that the material on the website is kept up to date.
        </Text>

        <Heading as="h2" size="lg" mt={4}>
          Disclaimer
        </Heading>
        <Text>
          To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:
          <VStack pl={4} align="start">
            <Text>- limit or exclude our or your liability for death or personal injury;</Text>
            <Text>- limit or exclude our or your liability for fraud or fraudulent misrepresentation;</Text>
            <Text>- limit any of our or your liabilities in any way that is not permitted under applicable law; or</Text>
            <Text>- exclude any of our or your liabilities that may not be excluded under applicable law.</Text>
          </VStack>
        </Text>
        <Text>
          The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort and for breach of statutory duty.
        </Text>
        <Text>
          As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.
        </Text>
      </VStack>
    </Box>
  );
}
