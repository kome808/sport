
import re
import json

# Read the file content
with open('d:/程式開發/運動管理平台/frontend/temp_Assets.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Helper to calculate average X of a polygon string
def get_avg_x(points_str):
    coords = points_str.strip().split()
    x_coords = [float(coords[i]) for i in range(0, len(coords), 2)]
    return sum(x_coords) / len(x_coords)

# Process data blocks
def process_data(data_name, view_type):
    # Find the array block e.g. export const anteriorData: ISVGModelData[] = [ ... ];
    pattern = rf"export const {data_name}: ISVGModelData\[\] = \[(.*?)\];"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return []

    block_content = match.group(1)
    
    # Extract individual objects
    # { muscle: MuscleType.CHEST, svgPoints: [ ... ] },
    object_pattern = r"\{\s*muscle:\s*MuscleType\.([A-Z_]+),\s*svgPoints:\s*\[(.*?)\]\s*,?\s*\}"
    objects = re.finditer(object_pattern, block_content, re.DOTALL)

    results = []

    for obj in objects:
        muscle_name = obj.group(1).lower()
        svg_points_block = obj.group(2)
        
        # Extract point strings (handling quotes)
        points = re.findall(r"['\"](.*?)['\"]", svg_points_block)
        
        for i, p in enumerate(points):
            avg_x = get_avg_x(p)
            
            # Determine side
            suffix = ''
            if muscle_name in ['head', 'neck', 'abs', 'upper_back', 'lower_back', 'obliques']: 
                 # Some center muscles might still be split, let's see. 
                 # If it's clearly one side, add suffix. If it's one piece, maybe no suffix?
                 # But sticking to the user request, they want to click LEFT or RIGHT.
                 # So even ABS should be split if possible.
                 pass

            if view_type == 'front':
                # Anterior: x < 50 is Right (Subject's Right), x > 50 is Left
                if avg_x < 50:
                    suffix = '_r'
                else:
                    suffix = '_l'
            else:
                # Posterior: x < 50 is Left (Subject's Left), x > 50 is Right
                if avg_x < 50:
                    suffix = '_l'
                else:
                    suffix = '_r'
            
            # Special case for HEAD which might be single piece
            if muscle_name == 'head' and len(points) == 1:
                # Keep as 'head'? Or just 'head' (no L/R)
                # If the user clicks head, does side matter? Maybe not.
                # Let's keep it 'head' if it's central.
                if 40 < avg_x < 60:
                     suffix = '' 
                     if view_type == 'back': suffix = '_back'

            # Special naming for back view to avoid collision if needed, 
            # though usually we render separate views.
            # But unique IDs for the whole system is better.
            
            final_id = muscle_name + suffix
            if view_type == 'back' and not final_id.endswith('_back') and muscle_name == 'head':
                final_id += '_back' # Ensure head back is distinct from head front

            # Map English to Chinese names (Basic mapping)
            name_map = {
                'head': '頭部', 'neck': '頸部', 'chest': '胸部', 'obliques': '側腹',
                'abs': '腹肌', 'biceps': '二頭肌', 'triceps': '三頭肌', 
                'front_deltoids': '前三角肌', 'back_deltoids': '後三角肌',
                'trapezius': '斜方肌', 'upper_back': '上背', 'lower_back': '下背',
                'forearm': '前臂', 'gluteal': '臀部', 'abductor': '外展肌', 'abductors': '外展肌',
                'hamstring': '大腿後側', 'quadriceps': '股四頭肌', 'knees': '膝蓋',
                'calves': '小腿', 'left_soleus': '比目魚肌(左)', 'right_soleus': '比目魚肌(右)'
            }
            
            # Better Chinese Logic
            c_name = name_map.get(muscle_name, muscle_name)
            if suffix == '_l': c_name = '左' + c_name
            if suffix == '_r': c_name = '右' + c_name

            results.append({
                'id': final_id,
                'name': c_name,
                'view': view_type,
                'points': p
            })
            
    return results

front_parts = process_data('anteriorData', 'front')
back_parts = process_data('posteriorData', 'back')

all_parts = front_parts + back_parts

# Output TypeScript file
ts_content = """
export interface BodyPartPath {
    id: string;
    name: string;
    points: string;
    view: 'front' | 'back';
}

export const BODY_PATHS: BodyPartPath[] = [
"""

for p in all_parts:
    ts_content += f"    {{ id: '{p['id']}', name: '{p['name']}', view: '{p['view']}', points: '{p['points']}' }},\n"

ts_content += "];\n"

with open('d:/程式開發/運動管理平台/frontend/src/components/player/BodyMapPaths.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated {len(all_parts)} paths.")
