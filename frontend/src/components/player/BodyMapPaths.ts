
export interface BodyPartPath {
    id: string;
    name: string;
    d: string;
    view: 'front' | 'back';
    alias?: string;
}

export const BODY_PATHS: BodyPartPath[] = [
    // --- Front View ---

    // Head & Neck
    { id: 'head', name: '頭部', view: 'front', d: 'M100,60 C113.8,60 125,48.8 125,35 C125,21.2 113.8,10 100,10 C86.2,10 75,21.2 75,35 C75,48.8 86.2,60 100,60 Z' },
    { id: 'neck', name: '頸部', view: 'front', d: 'M92,60 L108,60 L108,72 L92,72 Z' },

    // Torso (Front)
    { id: 'shoulder_l', name: '左肩膀', view: 'front', d: 'M108,72 L140,75 L135,95 L108,85 Z' }, // Patient's Left (Viewer's Right)
    { id: 'shoulder_r', name: '右肩膀', view: 'front', d: 'M92,72 L60,75 L65,95 L92,85 Z' },

    { id: 'core_front', name: '核心/腹部', view: 'front', d: 'M92,85 L108,85 L108,135 L92,135 Z' },  // Simplified center
    { id: 'chest_l', name: '左胸', view: 'front', d: 'M108,85 L135,95 L130,135 L108,135 Z' }, // Custom chest part mapped to core? Or separate? Let's keep it simple or merge into core for now as 'core_front' covers mainly abs.
    // Actually, let's make a bigger Torso shape if we want to be like the old one, but segmented.
    // Let's redefine 'core_front' to be the main torso block for simplicity to match existing logic
    // New Chest/Abs split might be too complex for now, stick to 'core_front' covering Chest+Abs
    // Redo core_front to be the whole trunk minus shoulders
    // Override previous core_front:
    { id: 'core_front', name: '軀幹/核心', view: 'front', d: 'M92,85 L108,85 L108,72 L135,75 L130,140 L108,140 L108,140 L92,140 L70,140 L65,75 L92,72 Z' },

    // Arms (Front)
    { id: 'arm_l', name: '左大臂', view: 'front', d: 'M140,75 L145,110 L125,110 L135,95 Z' },
    { id: 'arm_r', name: '右大臂', view: 'front', d: 'M60,75 L55,110 L75,110 L65,95 Z' },

    // Elbows (Joints - Circles)
    { id: 'elbow_l', name: '左手肘', view: 'front', d: 'M145,110 A10,10 0 1,1 145.1,110 Z' }, // Placeholder circle logic, actually let's draw a nice rounded rect or circle.
    // Using a path drawing a circle at cx=135, cy=115
    { id: 'elbow_l', name: '左手肘', view: 'front', d: 'M142,110 L146,110 L146,122 L142,122 Z' }, // Rect for now, to be safe. Wait, joints should be circular.
    // SVG Path for Circle: M cx, cy m -r, 0 a r,r 0 1,0 (r * 2),0 a r,r 0 1,0 -(r * 2),0
    // Center Left Elbow ~ (135, 115)
    { id: 'elbow_l', name: '左手肘', view: 'front', d: 'M125,110 L145,110 L143,125 L127,125 Z' },
    { id: 'elbow_r', name: '右手肘', view: 'front', d: 'M75,110 L55,110 L57,125 L73,125 Z' },

    // Forearms
    { id: 'forearm_l', name: '左前臂', view: 'front', d: 'M143,125 L145,150 L125,150 L127,125 Z' }, // Note: System uses 'wrist' usually for lower part, but let's add 'forearm' map to 'arm_l' or NEW? 
    // The old system didn't have forearm. It had 'wrist' right after 'elbow'. 
    // Old: elbow (110-125), wrist (125-150). So 'wrist' was effectively the forearm?
    // Let's call this 'arm_lower_l' physically, but map to 'wrist_l' or add 'forearm_l'.
    // User wants "Joints". So Elbow -> Forearm -> Wrist. 
    // Let's stick to existing ID: 'wrist_l' is likely the joint. 'elbow_l' is joint.
    // 'arm_l' is upper. Is there a lower arm?
    // Looking at old code: 
    // arm_r (80-110) -> Upper
    // elbow_r (110-125) -> Joint
    // wrist_r (125-150) -> This looks like Forearm + Wrist.
    // Let's make:
    // arm_r (Upper)
    // elbow_r (Joint)
    // forearm_r (Lower Arm) -> New ID? Or reuse a slot?
    // wrist_r (Joint) -> New Joint
    // hand_r (Hand)
    // If I introduce new IDs, I must update key mapping.
    // Let's check PainReportForm keys again.
    // keys: shoulder, arm, elbow, wrist, hip, thigh, knee, calf, ankle.
    // Missing: Forearm, Hand.
    // Strategy: 
    // Map 'Upper Arm' -> arm
    // Map 'Elbow' -> elbow
    // Map 'Forearm' -> wrist (Rename display to "前臂/手腕"?) Or just map click to 'arm' or 'wrist'? 
    // Let's add 'forearm' to the keys list in PainReportForm if possible, OR map it to 'arm' as well?
    // Better: Add 'forearm_l/r' and 'hand_l/r' as VALID keys and update the Form to handle them.
    // But for now, to ensure compatibility, I will use:
    // arm_l -> Upper Arm
    // elbow_l -> Elbow
    // wrist_l -> Forearm + Wrist area (Renamed to '前臂')
    // hand_l -> New?
    // Let's use the layout:
    // arm (Upper) -> elbow (Joint) -> forearm (Lower - mapped to 'arm' or new?)
    // Let's assume I can add new keys. 

    // Forearms (using 'forearm' id, need to add to mapped types later)
    { id: 'forearm_l', name: '左前臂', view: 'front', d: 'M127,125 L143,125 L140,150 L130,150 Z' },
    { id: 'forearm_r', name: '右前臂', view: 'front', d: 'M73,125 L57,125 L60,150 L70,150 Z' },

    // Wrists (Joints)
    { id: 'wrist_l', name: '左手腕', view: 'front', d: 'M130,150 L140,150 L140,160 L130,160 Z' },
    { id: 'wrist_r', name: '右手腕', view: 'front', d: 'M70,150 L60,150 L60,160 L70,160 Z' },

    // Hands
    { id: 'hand_l', name: '左手掌', view: 'front', d: 'M130,160 L140,160 L142,175 L128,175 Z' },
    { id: 'hand_r', name: '右手掌', view: 'front', d: 'M70,160 L60,160 L58,175 L72,175 Z' },

    // Hips/Pelvis (Front - often 'hip' or 'groin')
    { id: 'hip_front', name: '髖部/鼠蹊', view: 'front', d: 'M70,140 L130,140 L125,160 L75,160 Z' },

    // Legs
    { id: 'thigh_l', name: '左大腿', view: 'front', d: 'M100,160 L125,160 L120,210 L105,210 Z' },
    { id: 'thigh_r', name: '右大腿', view: 'front', d: 'M100,160 L75,160 L80,210 L95,210 Z' },

    // Knees (Joints)
    { id: 'knee_l', name: '左膝蓋', view: 'front', d: 'M105,210 L120,210 L118,230 L107,230 Z' },
    { id: 'knee_r', name: '右膝蓋', view: 'front', d: 'M95,210 L80,210 L82,230 L93,230 Z' }, // Slight tweak to match width

    // Calves (Shins in front)
    { id: 'calf_l', name: '左小腿', view: 'front', d: 'M107,230 L118,230 L115,270 L110,270 Z' },
    { id: 'calf_r', name: '右小腿', view: 'front', d: 'M93,230 L82,230 L85,270 L90,270 Z' },

    // Ankles
    { id: 'ankle_l', name: '左腳踝', view: 'front', d: 'M110,270 L115,270 L115,280 L110,280 Z' },
    { id: 'ankle_r', name: '右腳踝', view: 'front', d: 'M90,270 L85,270 L85,280 L90,280 Z' },

    // Feet
    { id: 'foot_l', name: '左腳掌', view: 'front', d: 'M110,280 L115,280 L120,295 L110,295 Z' },
    { id: 'foot_r', name: '右腳掌', view: 'front', d: 'M90,280 L85,280 L80,295 L90,295 Z' },


    // --- Back View ---

    // Head Back
    { id: 'head_back', alias: 'head', name: '頭部(後)', view: 'back', d: 'M100,60 C113.8,60 125,48.8 125,35 C125,21.2 113.8,10 100,10 C86.2,10 75,21.2 75,35 C75,48.8 86.2,60 100,60 Z' },
    { id: 'neck_back', alias: 'neck', name: '頸部(後)', view: 'back', d: 'M92,60 L108,60 L108,72 L92,72 Z' },

    // Back (Upper/Lower)
    { id: 'back_upper', name: '上背部', view: 'back', d: 'M92,72 L108,72 L135,75 L130,110 L70,110 L65,75 Z' },
    { id: 'back_lower', name: '下背部', view: 'back', d: 'M70,110 L130,110 L125,140 L75,140 Z' },

    // Shoulders Back
    { id: 'shoulder_l_back', alias: 'shoulder_l', name: '左肩膀', view: 'back', d: 'M65,75 L60,95 L92,85 L92,72 Z' }, // Viewer Left is Person Left (Back view) -> Wait.
    // Back view: Viewer's Left is Person's Left side? 
    // Standard: 
    // Front View: Viewer Left = Person Right.
    // Back View: Viewer Left = Person Left.
    // So 'shoulder_l' (Person Left) should be on the Left side of the image in Back View.
    // In SVG coordinate ~65 (Left side).
    { id: 'shoulder_l_back', alias: 'shoulder_l', name: '左肩膀', view: 'back', d: 'M65,75 L60,95 L90,85 L92,72 Z' },
    { id: 'shoulder_r_back', alias: 'shoulder_r', name: '右肩膀', view: 'back', d: 'M135,75 L140,95 L110,85 L108,72 Z' },

    // Arms Back
    { id: 'arm_l_back', alias: 'arm_l', name: '左大臂', view: 'back', d: 'M60,75 L55,110 L75,110 L65,95 Z' },
    { id: 'arm_r_back', alias: 'arm_r', name: '右大臂', view: 'back', d: 'M140,75 L145,110 L125,110 L135,95 Z' },

    // Elbows Back
    { id: 'elbow_l_back', alias: 'elbow_l', name: '左手肘', view: 'back', d: 'M75,110 L55,110 L57,125 L73,125 Z' },
    { id: 'elbow_r_back', alias: 'elbow_r', name: '右手肘', view: 'back', d: 'M125,110 L145,110 L143,125 L127,125 Z' },

    // Forearms Back
    { id: 'forearm_l_back', alias: 'forearm_l', name: '左前臂', view: 'back', d: 'M73,125 L57,125 L60,150 L70,150 Z' },
    { id: 'forearm_r_back', alias: 'forearm_r', name: '右前臂', view: 'back', d: 'M127,125 L143,125 L140,150 L130,150 Z' },

    // Wrists Back
    { id: 'wrist_l_back', alias: 'wrist_l', name: '左手腕', view: 'back', d: 'M70,150 L60,150 L60,160 L70,160 Z' },
    { id: 'wrist_r_back', alias: 'wrist_r', name: '右手腕', view: 'back', d: 'M130,150 L140,150 L140,160 L130,160 Z' },

    // Hands Back
    { id: 'hand_l_back', alias: 'hand_l', name: '左手背', view: 'back', d: 'M70,160 L60,160 L58,175 L72,175 Z' },
    { id: 'hand_r_back', alias: 'hand_r', name: '右手背', view: 'back', d: 'M130,160 L140,160 L142,175 L128,175 Z' },

    // Hips/Glutes Back
    { id: 'hip_l_back', alias: 'hip_l', name: '左臀部', view: 'back', d: 'M75,140 L100,140 L100,160 L75,160 Z' },
    { id: 'hip_r_back', alias: 'hip_r', name: '右臀部', view: 'back', d: 'M100,140 L125,140 L125,160 L100,160 Z' },

    // Legs Back (Hamstrings)
    { id: 'thigh_l_back', alias: 'thigh_l', name: '左大腿(後)', view: 'back', d: 'M100,160 L75,160 L80,210 L95,210 Z' },
    { id: 'thigh_r_back', alias: 'thigh_r', name: '右大腿(後)', view: 'back', d: 'M100,160 L125,160 L120,210 L105,210 Z' },

    // Knees Back (Popliteal fossa)
    { id: 'knee_l_back', alias: 'knee_l', name: '左膝窩', view: 'back', d: 'M95,210 L80,210 L82,230 L93,230 Z' },
    { id: 'knee_r_back', alias: 'knee_r', name: '右膝窩', view: 'back', d: 'M105,210 L120,210 L118,230 L107,230 Z' },

    // Calves Back
    { id: 'calf_l_back', alias: 'calf_l', name: '左小腿(後)', view: 'back', d: 'M93,230 L82,230 L85,270 L90,270 Z' },
    { id: 'calf_r_back', alias: 'calf_r', name: '右小腿(後)', view: 'back', d: 'M107,230 L118,230 L115,270 L110,270 Z' },

    // Ankles Back
    { id: 'ankle_l_back', alias: 'ankle_l', name: '左腳跟', view: 'back', d: 'M90,270 L85,270 L85,280 L90,280 Z' },
    { id: 'ankle_r_back', alias: 'ankle_r', name: '右腳跟', view: 'back', d: 'M110,270 L115,270 L115,280 L110,280 Z' },

    // Feet Back (Soles/Heels)
    { id: 'foot_l_back', alias: 'foot_l', name: '左腳底', view: 'back', d: 'M90,280 L85,280 L80,295 L90,295 Z' },
    { id: 'foot_r_back', alias: 'foot_r', name: '右腳底', view: 'back', d: 'M110,280 L115,280 L120,295 L110,295 Z' },
];
