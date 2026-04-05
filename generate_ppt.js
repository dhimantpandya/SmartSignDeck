const pptxgen = require('pptxgenjs');

async function createPresentation() {
    let pptx = new pptxgen();

    // Set Presentation Options
    pptx.author = 'Dhimant N. Pandya';
    pptx.company = 'Technostacks Infotech';
    pptx.subject = 'SmartSignDeck Final Project Presentation';
    pptx.title = 'SmartSignDeck';

    // SLIDE 1: TITLE SLIDE
    let slide1 = pptx.addSlide();
    slide1.background = { color: 'F4F4F4' };
    slide1.addText('SmartSignDeck', { x: 1, y: 1.5, w: '80%', color: '363636', fontSize: 44, bold: true, align: 'center' });
    slide1.addText('Digital Signage Management System', { x: 1, y: 2.5, w: '80%', color: '666666', fontSize: 24, align: 'center' });
    
    slide1.addText('Developed By: Dhimant N. Pandya (BC065 / 23BCUOS076)\nGroup: M5 | Under Guidance of Prof. Minaz Shaikh\nDeveloped At: Technostacks Infotech', { x: 1, y: 4.5, w: '80%', color: '363636', fontSize: 16, align: 'center', italic: true });

    // SLIDE 2: ABOUT THE SYSTEM
    let slide2 = pptx.addSlide();
    slide2.addText('About The System', { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: '003366' });
    slide2.addText(
        'SmartSignDeck is a cloud-based Digital Signage Management SaaS platform that enables businesses to display dynamic rich-media content (images, videos, text, clocks) on remote screens seamlessly.\n\n' +
        'Core Objectives:\n' +
        '• Centralized control over multiple distributed displays.\n' +
        '• Drag-and-drop template designer for rich media zones.\n' +
        '• Multi-tenant architecture (company workspaces).\n' +
        '• Real-time content synchronization via WebSockets.', 
        { x: 0.5, y: 1.5, w: 9, fontSize: 18, bullet: true, lineSpacing: 25 }
    );

    // SLIDE 3: HARDWARE & SOFTWARE
    let slide3 = pptx.addSlide();
    slide3.addText('Hardware & Software Details', { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: '003366' });
    
    slide3.addText('Software Requirements:', { x: 0.5, y: 1.3, fontSize: 20, bold: true, color: '333333' });
    slide3.addText(
        '• Frontend: React.js, TypeScript, TailwindCSS, Fabric.js (Canvas)\n' +
        '• Backend: Node.js, Express.js, Socket.IO\n' +
        '• Database: MongoDB Atlas (NoSQL)\n' +
        '• Authentication: Google Firebase OAuth + Custom JWTs\n' +
        '• Cloud Storage: Cloudinary (for images/videos)', 
        { x: 0.5, y: 1.8, w: 9, fontSize: 16, bullet: true }
    );

    slide3.addText('Hardware Recommendations:', { x: 0.5, y: 3.5, fontSize: 20, bold: true, color: '333333' });
    slide3.addText(
        '• Server: Minimal 2GB RAM, 2 vCPUs (Node env)\n' +
        '• Client (Player Display): Any smart TV or Raspberry Pi with a browser\n' +
        '• Internet Connection: Required for real-time WebSocket sync', 
        { x: 0.5, y: 4.0, w: 9, fontSize: 16, bullet: true }
    );

    // SLIDE 4: FEASIBILITY STUDY
    let slide4 = pptx.addSlide();
    slide4.addText('Feasibility Study', { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: '003366' });
    slide4.addText(
        '1. Technical Feasibility:\n' +
        '   Using the MERN stack guarantees high scalability and rapid development. WebSockets handle real-time sync with low overhead.\n\n' +
        '2. Economic Feasibility:\n' +
        '   Cloud infrastructure operates on a Pay-As-You-Go model. Open-source libraries keep upfront licensing costs near zero.\n\n' +
        '3. Operational Feasibility:\n' +
        '   Platform UI is highly intuitive, relying on standard drag-and-drop mechanics. End users require almost no training.', 
        { x: 0.5, y: 1.5, w: 9, fontSize: 18 }
    );

    // SLIDE 5: USE CASE & FLOW CHART
    let slide5 = pptx.addSlide();
    slide5.addText('Use Case & Flow Chart', { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: '003366' });
    slide5.addText('[ Please insert your Use Case Diagram Image Here ]', { x: 1, y: 2, w: 3, h: 2, align: 'center', fill: 'F1F1F1', color: 'A9A9A9' });
    slide5.addText('[ Please insert your Flow Chart Image Here ]', { x: 5, y: 2, w: 3, h: 2, align: 'center', fill: 'F1F1F1', color: 'A9A9A9' });
    slide5.addText('Key Use Cases: Registration, Template Creation, Screen Assignment, Analytics Tracking.', { x: 0.5, y: 4.5, w: 9, fontSize: 16, italic: true });

    // SLIDE 6: ACTIVITY & SEQUENCE DIAGRAMS
    let slide6 = pptx.addSlide();
    slide6.addText('Activity & Sequence Diagrams', { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: '003366' });
    slide6.addText('[ Insert Activity Diagram Image Here ]', { x: 1, y: 2, w: 3, h: 2, align: 'center', fill: 'F1F1F1', color: 'A9A9A9' });
    slide6.addText('[ Insert Sequence Diagram Image Here ]', { x: 5, y: 2, w: 3, h: 2, align: 'center', fill: 'F1F1F1', color: 'A9A9A9' });
    slide6.addText('Demonstrating the real-time synchronous connection between Admin Board and Display Screen (Player).', { x: 0.5, y: 4.5, w: 9, fontSize: 16, italic: true });

    // SLIDE 7: DATA FLOW DIAGRAMS
    let slide7 = pptx.addSlide();
    slide7.addText('Data Flow Diagrams (DFD)', { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: '003366' });
    slide7.addText('[ Insert Level 0 / Context DFD Image Here ]', { x: 1, y: 2, w: 3, h: 2, align: 'center', fill: 'F1F1F1', color: 'A9A9A9' });
    slide7.addText('[ Insert Level 1 DFD Image Here ]', { x: 5, y: 2, w: 3, h: 2, align: 'center', fill: 'F1F1F1', color: 'A9A9A9' });
    slide7.addText('Displaying the flow of media and scheduling instructions from User -> Server -> Display Node.', { x: 0.5, y: 4.5, w: 9, fontSize: 16, italic: true });

    // SLIDE 8: SCREEN LAYOUTS & UI
    let slide8 = pptx.addSlide();
    slide8.addText('System Screen Layouts', { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: '003366' });
    slide8.addText('[ Insert Dashboard Screenshot Here ]', { x: 0.5, y: 1.5, w: 4, h: 2, align: 'center', fill: 'F1F1F1', color: 'A9A9A9' });
    slide8.addText('[ Insert Template Editor Screenshot Here ]', { x: 5, y: 1.5, w: 4, h: 2, align: 'center', fill: 'F1F1F1', color: 'A9A9A9' });
    slide8.addText('[ Insert Player View Screenshot Here ]', { x: 2.75, y: 3.8, w: 4, h: 1.5, align: 'center', fill: 'F1F1F1', color: 'A9A9A9' });

    // SLIDE 9: LIMITATIONS & FUTURE EXPANSION
    let slide9 = pptx.addSlide();
    slide9.addText('Limitations & Future Expansion', { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: '003366' });
    
    slide9.addText('Current Limitations:', { x: 0.5, y: 1.3, fontSize: 20, bold: true, color: '333333' });
    slide9.addText(
        '• Screen Player requires a continuous internet connection (no offline caching yet).\n' +
        '• Native mobile app is currently unavailable; works via web browser only.\n' +
        '• Extremely high-resolution video streams may buffer on slow connections.', 
        { x: 0.5, y: 1.8, w: 9, fontSize: 16, bullet: true }
    );

    slide9.addText('Future Expansion:', { x: 0.5, y: 3.5, fontSize: 20, bold: true, color: '333333' });
    slide9.addText(
        '• Develop standalone Mobile Apps (iOS/Android) for offline caching functionality.\n' +
        '• Implement AI to automatically recommend template designs based on industry.\n' +
        '• Introduce API integrations with 3rd-party services (Live News, Stock exchange).', 
        { x: 0.5, y: 4.0, w: 9, fontSize: 16, bullet: true }
    );

    // Save
    pptx.writeFile({ fileName: "SmartSignDeck_Presentation.pptx" }).then(() => {
        console.log("Successfully created PPT file: SmartSignDeck_Presentation.pptx");
    });
}

createPresentation();
