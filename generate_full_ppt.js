const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createFullPresentation() {
    let pptx = new pptxgen();

    // Set Presentation Options
    pptx.author = 'Dhimant N. Pandya';
    pptx.company = 'Technostacks Infotech';
    pptx.subject = 'SmartSignDeck Final Project Presentation';
    pptx.title = 'SmartSignDeck Presentation';

    // 🎨 DEFINE A MODERN MASTER THEME BACKGROUND
    pptx.defineSlideMaster({
        title: 'MASTER_SLIDE',
        background: { color: 'F4F6F9' }, 
        objects: [
            { rect: { x: 0, y: 0, w: '100%', h: 0.4, fill: { color: '0F172A' } } },
            { text: { text: 'SmartSignDeck | Cloud-Based Digital Signage', options: { x: 0.2, y: 0.05, w: 8, fontSize: 12, color: 'FFFFFF', bold: true } } },
            { rect: { x: 0, y: 5.3, w: '100%', h: 0.3, fill: { color: 'E2E8F0' } } },
            { text: { text: 'Dharmsinh Desai University | BCA Final Year Project', options: { x: 0.2, y: 5.35, w: 6, fontSize: 10, color: '64748B' } } },
            { slideNumber: { x: 9.4, y: 5.35, fontSize: 10, color: '64748B', bold: true } }
        ]
    });

    const addStandardSlide = (title, subTitle = null, subTitleColor = '003366') => {
        let slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        slide.addText(title, { x: 0.4, y: 0.6, w: '90%', fontSize: 26, bold: true, color: '003366' });
        if (subTitle) {
            slide.addText(subTitle, { x: 0.4, y: 1.1, fontSize: 20, bold: true, color: subTitleColor });
        }
        return slide;
    };

    const addSectionSlide = (title) => {
        let slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.8, w: 9, h: 2, fill: {color: '0F172A'} });
        slide.addText(title, { x: 0.5, y: 2.2, w: 9, fontSize: 38, bold: true, color: 'FFFFFF', align: 'center' });
        return slide;
    };

    const addDiagramSlide = (mainTitle, subTitle, imagePath, placeholderText = null) => {
        let slide = addStandardSlide(mainTitle, subTitle, 'D9381E');
        if (imagePath && fs.existsSync(imagePath)) {
            slide.addImage({ path: imagePath, x: 0.5, y: 1.5, w: 9.0, h: 3.5, sizing: {type: 'contain', w: 9.0, h: 3.5} });
        } else {
            slide.addText(placeholderText || "Image Path Not Found", { x: 1, y: 1.6, w: 8, h: 3.4, align: 'center', fill: 'F8FAFC', color: 'A9A9A9', fontSize: 18, border:{pt: 1, color:'CCCCCC', type:'dash'} });
        }
        return slide;
    };

    // 1. TITLE SLIDE (Redesigned to match Sample PPT)
    let slide1 = pptx.addSlide();
    slide1.background = { color: 'FFFFFF' }; 
    
    // Top Left Headers
    slide1.addText('Dharmsinh Desai University', { x: 0.2, y: 0.2, w: 4, color: '003366', fontSize: 16, bold: true });
    slide1.addText('Faculty of Information Science (BCA)', { x: 0.2, y: 0.45, w: 4, color: '64748B', fontSize: 12, italic: true });

    // Main Project Title
    slide1.addText('SmartSignDeck', { x: 0.5, y: 1.8, w: '90%', color: '003366', fontSize: 44, bold: true, align: 'center' });
    slide1.addText('Cloud-Based Digital Signage SaaS Platform', { x: 0.5, y: 2.5, w: '90%', color: 'D9381E', fontSize: 18, bold: true, align: 'center' });

    // Left Column: Internal Guide
    slide1.addText('INTERNAL GUIDE:', { x: 0.5, y: 4.0, w: 4, fontSize: 12, bold: true, color: '0F172A' });
    slide1.addText('Prof. Minaz Shaikh \nTechnostacks Infotech', { x: 0.5, y: 4.3, w: 4, fontSize: 12, color: '64748B' });

    // Right Column: Presented By
    slide1.addText('PRESENTED BY:', { x: 6.0, y: 4.0, w: 3.5, fontSize: 12, bold: true, color: '0F172A', align: 'right' });
    slide1.addText('DHIMANT N. PANDYA \n(BC065 / 23BCUOS076)', { x: 6.0, y: 4.3, w: 3.5, fontSize: 12, color: '64748B', bold: true, align: 'right' });

    // Bottom Footer
    slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 5.3, w: '100%', h: 0.3, fill: {color: '003366'} });
    slide1.addText('BCA Final Year Project | 2026', { x: 0, y: 5.35, w: '100%', color: 'FFFFFF', fontSize: 10, align: 'center' });

    // 2. CONTENTS SLIDE
    let slideContents = addStandardSlide('Contents');
    let contents = [
        'About The System',
        'Existing System',
        'Proposed System',
        'Data Flow Diagram',
        'Entity Relationship Diagram',
        'Data Dictionaries',
        'System Screen Layouts',
        'System Generated Reports',
        'Scope & Limitations',
        'Future Expansion'
    ];
    let bulletPoints = contents.map(item => ({ text: item, options: { bullet: true, italic: false, fontSize: 22, lineSpacing: 35 } }));
    slideContents.addText(bulletPoints, { x: 1.0, y: 1.5, w: 8, h: 3.5 });

    // 3. ABOUT THE SYSTEM (Restored & Refined)
    let slideAbout = addStandardSlide('About The System');
    slideAbout.addText([
        { text: '• SmartSignDeck is a SaaS platform for cross-platform visual communication.', options: { lineSpacing: 25 } },
        { text: '• Eliminates physical intervention (USB sticks) by enabling remote cloud-based updates.', options: { lineSpacing: 25 } },
        { text: '• Allows real-time synchronization of media across multiple geographical locations.', options: { lineSpacing: 25 } },
        { text: '• Provides a drag-and-drop Layout Canvas for non-technical administrators.', options: { lineSpacing: 25 } },
        { text: '• Features Multi-Tenant architecture for secure organization-wide data isolation.', options: { lineSpacing: 25 } }
    ], { x: 0.4, y: 1.4, w: 9.2, fontSize: 18 });

    // 4. HARDWARE & SOFTWARE
    let slide4 = addStandardSlide('Hardware & Software Details');
    slide4.addText('Software Technologies (MERN Stack):', { x: 0.4, y: 1.2, fontSize: 18, bold: true });
    slide4.addText(
        '• Frontend: React.js, TypeScript, Fabric.js (Canvas)\n' +
        '• Backend: Node.js, Express.js, Socket.IO (WebSockets)\n' +
        '• Database: MongoDB Atlas (Mongoose ORM)\n' +
        '• Cloud Services: Firebase Auth, Cloudinary (Media)', 
        { x: 0.4, y: 1.6, w: 9.2, h: 1.3, fontSize: 16, valign: 'top' }
    );
    slide4.addText('Hardware Requirements:', { x: 0.4, y: 3.1, fontSize: 18, bold: true });
    slide4.addText(
        '• Cloud Server: 2 vCPUs, 2GB RAM minimum (Backend Hosting)\n' +
        '• Display Server (Player): Smart TV, Raspberry Pi, or mini-PC on Internet\n' +
        '• Network: Standard WiFi/Broadband for live WebSocket stream.', 
        { x: 0.4, y: 3.5, w: 9.2, h: 1.3, fontSize: 16, valign: 'top' }
    );

    // 5. EXISTING SYSTEM
    let slideExist = addStandardSlide('Existing System');
    slideExist.addText([
        { text: '• Manual Effort: Staff must physically travel to screens with USB pen drives.', options: { lineSpacing: 22 } },
        { text: '• Decentralized Control: No way to sync multiple displays simultaneously.', options: { lineSpacing: 22 } },
        { text: '• Zero Monitoring: Admin cannot see if a screen is offline in another building.', options: { lineSpacing: 22 } },
        { text: '• Stagnant Content: Hard to integrate dynamic feeds like weather, clocks, or news.', options: { lineSpacing: 22 } }
    ], { x: 0.4, y: 1.5, w: 9.2, fontSize: 18 });

    // 6. PROPOSED SYSTEM
    let slideProposed = addStandardSlide('Proposed System');
    slideProposed.addText([
        { text: '• Cloud-Native Orchestration: Centralize all global screens in one dashboard.', options: { lineSpacing: 22 } },
        { text: '• Real-Time WebSocket Delivery: Deploy media changes instantly (millisecond latency).', options: { lineSpacing: 22 } },
        { text: '• Dynamic Visual Builder: Create zones with live clocks, videos, and images.', options: { lineSpacing: 22 } },
        { text: '• Cross-Role Collaboration: Delegate screen control to Admins and Advertisers.', options: { lineSpacing: 22 } }
    ], { x: 0.4, y: 1.5, w: 9.2, fontSize: 18 });

    // 7. FEASIBILITY
    let slide5 = addStandardSlide('Feasibility Study');
    slide5.addText(
        '1. Technical Feasibility:\n' +
        '   • Proven Node.js/WebSocket scaling at Technostacks environment.\n\n' +
        '2. Economic Feasibility:\n' +
        '   • Open-source core reduces development costs; cloud hosting is scalable.\n\n' +
        '3. Operational Feasibility:\n' +
        '   • User-friendly interface eliminates the need for specialized IT training.', 
        { x: 0.4, y: 1.3, w: 9.2, h: 3.5, fontSize: 18, lineSpacing: 22, valign: 'top' }
    );

    // 8. DIAGRAMS SECTION
    addSectionSlide('System Diagrams\n(UML, Data Flow, & ER)');
    
    // Use Case
    addDiagramSlide('Use Case Diagram', 'Super Admin & Multi-User Access', path.join(__dirname, 'docs/images/use_case_super_admin.png'));
    
    // DFD
    addDiagramSlide('Data Flow Diagram', 'Context Level (Level 0)', path.join(__dirname, 'docs/images/dfd_level_0_context.png'));
    addDiagramSlide('Data Flow Diagram', 'Level 1: System Orchestration', path.join(__dirname, 'docs/images/dfd_level_1_admin.png'));
    
    // ER
    addDiagramSlide('ER Diagram', 'Database Relationships (Admin/Owner View)', path.join(__dirname, 'docs/images/erd_admin_owner.png'));

    // 14. DATA DICTIONARY SECTION
    addSectionSlide('Data Dictionary');
    const buildTableSlide = (heading, desc, headers, rows) => {
        let st = addStandardSlide(heading);
        st.addText('Description: ' + desc, { x: 0.4, y: 0.9, w: 9, fontSize: 12, italic: true });
        let tableData = [headers.map(h => ({text: h, options: {bold: true, fill: '0F172A', color: 'FFFFFF'}}))];
        rows.forEach(row => tableData.push(row.map(r => ({text: r, options: {valign: 'middle'}}))));
        st.addTable(tableData, { x: 0.4, y: 1.4, w: 9.2, rowH: 0.4, colW: [0.5, 2.5, 2.0, 4.2], fontSize: 12, border: {type: 'solid', pt: 1, color: 'E2E8F0'} });
    };
    buildTableSlide('Collection: users', 'Store user profiles and roles.', ['No', 'Field Name', 'Type', 'Description'], [['1', '_id', 'ObjectId', 'Primary key'],['2', 'name', 'String', 'Full name'],['3', 'email', 'String', 'Unique email'],['4', 'role', 'String', 'Access level']]);
    buildTableSlide('Collection: screens', 'Track hardware status.', ['No', 'Field Name', 'Type', 'Description'], [['1', '_id', 'ObjectId', 'Primary key'],['2', 'name', 'String', 'Label'],['3', 'macAddress', 'String', 'Unique ID'],['4', 'status', 'String', 'Online/Offline']]);

    // 15. SCREEN LAYOUTS SECTION
    addSectionSlide('System Screen Layouts');
    const layoutRootDir = path.join(__dirname, 'screen layouts');
    const folderOrder = [
        { dir: "LP", title: "Landing Pages" },
        { dir: "Authentication/Login", title: "Login Screens" },
        { dir: "Authentication/Reg", title: "Registration Process" },
        { dir: "Templates", title: "Template Builder" },
        { dir: "Screen", title: "Screen Management" },
        { dir: "Playlist", title: "Playlist Management" },
        { dir: "Super Admin", title: "Super Admin Console" },
        { dir: "Ana", title: "Real-time Analytics" }
    ];
    if (fs.existsSync(layoutRootDir)) {
        folderOrder.forEach(category => {
            let catPath = path.join(layoutRootDir, category.dir);
            if (fs.existsSync(catPath) && fs.statSync(catPath).isDirectory()) {
                fs.readdirSync(catPath).forEach(file => {
                    if (file.match(/\.(png|jpe?g|webp)$/i)) {
                        addDiagramSlide(category.title, 'System Screenshot Interface', path.join(catPath, file));
                    }
                });
            }
        });
    }

    // 16. REPORTS SECTION
    addSectionSlide('System Generated Reports');
    const reportsDir = path.join(__dirname, 'Reports');
    if (fs.existsSync(reportsDir)) {
        fs.readdirSync(reportsDir).forEach(file => {
            if (file.match(/\.(png|jpe?g|webp)$/i)) {
                addDiagramSlide('Generated Report', file.replace(/\.(png|jpe?g|webp)$/i, ''), path.join(reportsDir, file));
            }
        });
    }

    // 17. SCOPE AND LIMITATIONS
    let slideScope = addStandardSlide('Scope & Limitations');
    slideScope.addText('Scope:', { x: 0.4, y: 1.0, fontSize: 18, bold: true });
    slideScope.addText('• Pushing live updates to global screen networks.\n• Scalable Multi-User/Multi-Company SaaS design.\n• Granular audit logs for marketing engagement.', { x: 0.4, y: 1.4, w: 9.2, fontSize: 16 });
    slideScope.addText('Limitations:', { x: 0.4, y: 2.7, fontSize: 18, bold: true });
    slideScope.addText('• Requires persistent internet for new content sync.\n• Browser-based player performance varies by hardware.\n• No automatic local timezone sync (unified system time).', { x: 0.4, y: 3.1, w: 9.2, fontSize: 16 });

    // 18. FUTURE EXPANSION
    let slideFuture = addStandardSlide('Future Expansion');
    slideFuture.addText('1. Offline Cache Engine (Electron/Native Apps)\n2. AI-Driven Smart Content Scheduling\n3. Camera-based Audience Demographic Engagement\n4. Automatic Ad-Revenue Bidding Integration', { x: 0.4, y: 1.2, w: 9.2, fontSize: 18, lineSpacing: 28 });

    // 19. CONCLUSION
    let slideConc = pptx.addSlide();
    slideConc.background = { color: '0F172A' }; 
    slideConc.addText('Thank You', { x: 0.5, y: 2.1, w: '90%', fontSize: 54, bold: true, color: '00B4D8', align: 'center' });
    slideConc.addText('Any Questions?', { x: 0.5, y: 3.2, w: '90%', fontSize: 28, italic: true, color: 'F4F6F9', align: 'center' });

    // Save
    let outputName = `SmartSignDeck_Presentation_ULTIMATE.pptx`;
    pptx.writeFile({ fileName: outputName }).then(() => {
        console.log("Successfully created: " + outputName);
    }).catch(err => {
        let fallbackName = `SmartSignDeck_Presentation_ULTIMATE_${Date.now()}.pptx`;
        pptx.writeFile({ fileName: fallbackName });
        console.log("File was locked, created fallback: " + fallbackName);
    });
}

createFullPresentation();
