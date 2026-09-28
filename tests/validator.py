import sys
import os
import re
import glob
import csv
from datetime import datetime

# --- Configuration: Manual Limits (Modify as needed) ---
TEXT_LIMITS = {
    'encounter_name': 35,
    'encounter_desc': 120,
    'encounter_msg': 120,
    'origin_name': 35,
    'origin_desc': 150,
    'achievement_desc': 60,
    'achievement_hint': 60,
    'log_message': 38,
    'button_text': 30,
}

# Warning threshold multiplier (warn if text is > average * multiplier)
# Set to 0 to disable average-based warnings
AVG_MULTIPLIER = 2.0

def clean_html(text):
    if not text: return ""
    return re.sub(r'<[^>]+>', '', text)

# Variation selectors and ZWJ that glue emoji sequences — strip before counting
# so emoji+modifier counts as 1 visual character.
_EMOJI_JOINER_RE = re.compile(r'[︎️‍]')

def display_len(text):
    """Length after stripping HTML tags and emoji joiners/variation-selectors."""
    if not text: return 0
    text = re.sub(r'<[^>]+>', '', text)
    text = _EMOJI_JOINER_RE.sub('', text)
    return len(text)

def validate_achievement_origins(warnings, errors):
    print("Validating Achievement/Origin consistency...")
    ach_file = 'js/achievements.js'
    org_file = 'data/origins.csv'
    if not os.path.exists(ach_file) or not os.path.exists(org_file):
        return

    with open(ach_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract ACHIEVEMENTS array: id and unlock text
    ach_matches = re.findall(r'\{\s*id:\s*[\'"]([^\'"]*)[\'"],[^{}]*?unlock:\s*[\'"](.*?)[\'"]\s*\}', content, re.DOTALL)
    ach_map = {id: unlock for id, unlock in ach_matches}

    origins = []
    with open(org_file, 'r', encoding='utf-8') as f:
        lines = [line for line in f if line.strip() and not line.strip().startswith('//')]
        reader = csv.DictReader(lines, delimiter=';')
        for row in reader:
            missing = [k for k, v in row.items() if v is None]
            if missing:
                errors.append(f"Wrong Column Count - origins.csv [{row.get('emoji', '').strip()} {row.get('name', '?').strip()}]: missing columns {missing}")
                continue
            origins.append(row)

    def clean_origin_name(name):
        name = clean_html(name)
        name = "".join(c for c in name if ord(c) < 128 or c in ' /').strip()
        name = re.sub(r'^[; ]+', '', name)
        name = re.sub(r'[>/ ]+$', '', name).strip()
        return name

    def get_origin_names(name):
        """Return all name variants to match against: base name + any [Name:...] override content.
        e.g. 'Raider[Name:Tomb Raider]' → ['Raider', 'Tomb Raider']
             'Groom[Name:Kenneth]' → ['Groom', 'Kenneth']"""
        base = re.sub(r'\[[^\]]*\]', '', name).strip()
        bracket_match = re.search(r'\[Name:([^\]]+)\]', name)
        if bracket_match:
            return [base, bracket_match.group(1).strip()]
        return [base]

    # Check 1: Achievement unlock text -> Origin achievement ID
    for ach_id, unlock in ach_map.items():
        if re.search(r'\borigin\b', unlock.lower()):
            match = re.search(r'<b>(.*?)</b>', unlock)
            if match:
                raw_name = match.group(1).strip()
                origin_name = clean_origin_name(raw_name)
                if origin_name == 'Origins': continue

                found = False
                for origin in origins:
                    if origin_name in get_origin_names(origin['name'].strip()):
                        found = True
                        if origin['achiev'].strip() != ach_id:
                            errors.append(f"Achievement Mismatch: '{ach_id}' unlocks '{origin_name}' but origin.csv says unlocked by '{origin['achiev']}'")
                        break
                if not found:
                    errors.append(f"Achievement Error: '{ach_id}' claims to unlock unknown origin '{origin_name}' (raw: '{raw_name}')")

    # Check 2: Origin achievement ID -> Achievement unlock text
    for origin in origins:
        ach_id = origin['achiev'].strip()
        if ach_id and ach_id != 'none':
            if ach_id not in ach_map:
                errors.append(f"Origin Error: '{origin['name']}' refers to unknown achievement '{ach_id}'")
            else:
                unlock = ach_map[ach_id]
                if not any(dn in unlock for dn in get_origin_names(origin['name'].strip())):
                    errors.append(f"Achievement Mismatch: Origin '{origin['name']}' is unlocked by '{ach_id}', but achievement text doesn't mention it: '{unlock}'")

STAT_MAP = {
    '❤️ Health': 'hp', '💔 Health': 'hp',
    '⚔️ Attack': 'atk', '⚔️ Damage': 'atk',
    '🟢 Energy': 'sta',
    '🍀 Luck': 'lck', '🧠 Intellect': 'int', '🧠 INT': 'int',
    '🔵 Mana': 'mgk'
}

def _check_desc_stats(desc, row, file_label, errors):
    # Skip skill-granting items — their desc stats describe what the skill does, not direct grants
    msg = row.get('message', '').strip()
    if re.match(r'Gained (?:skill|ability|\d)', msg):
        return
    matches = re.findall(r'<b>([+-]\d+)\s+(.*?)</b>', desc)
    for val_str, stat_text in matches:
        try:
            val = int(val_str)
            stat_key = None
            for key in STAT_MAP:
                if key in stat_text:
                    stat_key = STAT_MAP[key]
                    break
            if stat_key and stat_key in row:
                csv_val = int(row[stat_key])
                if csv_val != val:
                    name = row.get('name', row.get('emoji', '?')).strip()
                    errors.append(f"Stat Mismatch - {file_label} [{name}]: Desc says {val_str} for {stat_text}, but CSV '{stat_key}' is {csv_val}")
        except ValueError:
            continue

def validate_origin_stats(warnings, errors):
    print("Validating Origin attribute/description matching...")
    org_file = 'data/origins.csv'
    if not os.path.exists(org_file):
        return
    with open(org_file, 'r', encoding='utf-8') as f:
        lines = [line for line in f if line.strip() and not line.strip().startswith('//')]
        reader = csv.DictReader(lines, delimiter=';')
        for row in reader:
            if any(v is None for v in row.values()):
                errors.append(f"Wrong Column Count - origins.csv [{row.get('emoji', '').strip()} {row.get('name', '?').strip()}]: skipping stat validation")
                continue
            _check_desc_stats(row['desc'], row, 'origins.csv', errors)

def validate_encounter_stats(warnings, errors):
    print("Validating Encounter/Story attribute/description matching...")
    for csv_file in ('data/encounters.csv', 'data/story.csv'):
        if not os.path.exists(csv_file):
            continue
        with open(csv_file, 'r', encoding='utf-8') as f:
            lines = [line for line in f if line.strip() and not line.strip().startswith('//')]
            reader = csv.DictReader(lines, delimiter=';')
            for row in reader:
                if any(v is None for v in row.values()):
                    continue
                _check_desc_stats(row.get('desc', ''), row, csv_file, errors)

def validate_string_generator_lengths(warnings):
    print("Validating String Generator lengths...")
    sg_file = 'js/string-generator.js'
    if not os.path.exists(sg_file):
        return
    
    desc_limit = TEXT_LIMITS['encounter_desc'] # 120
    
    with open(sg_file, 'r', encoding='utf-8') as f:
        content = f.read()

    def get_max_line_length(pattern):
        match = re.search(pattern, content, re.DOTALL)
        if not match: return 0
        max_l = 0
        for m in re.finditer(r'"([^"]*)"|\'([^\']*)\'', match.group(1)):
            msg = m.group(1) if m.group(1) is not None else m.group(2)
            for line in msg.split('<br>'):
                max_l = max(max_l, len(clean_html(line)))
        return max_l

    # Use RunStartMessage as the gold standard for line length
    line_limit = get_max_line_length(r'function getRunStartMessage\(\) \{(.*?)\}')

    def check_pool(pool_name, pattern, limit, split_br=False):
        match = re.search(pattern, content, re.DOTALL)
        if not match: return
        # Capture strings accurately regardless of internal quotes
        messages = []
        for m in re.finditer(r'"([^"]*)"|\'([^\']*)\'', match.group(1)):
            messages.append(m.group(1) if m.group(1) is not None else m.group(2))

        for msg in messages:
            if split_br:
                for line in msg.split('<br>'):
                    clean = clean_html(line)
                    if len(clean) > limit:
                        warnings.append(f"Long Line - {pool_name}: \"{clean[:30]}...\" is {len(clean)} chars (limit {limit})")
            else:
                clean = clean_html(msg.replace('<br>', ' '))
                if len(clean) > limit:
                    warnings.append(f"Long Text - {pool_name}: \"{clean[:30]}...\" is {len(clean)} chars (limit {limit})")

    # Run start and poems use stricter line limit
    check_pool("RunStartMessage", r'function getRunStartMessage\(\) \{(.*?)\}', line_limit, split_br=True)
    check_pool("BridePoem (Accusatory)", r'var accusatory = \[(.*?)\];', line_limit, split_br=True)
    check_pool("BridePoem (Longing)", r'var longing = \[(.*?)\];', line_limit, split_br=True)
    
    # Shop messages use encounter description limit
    shop_pattern = r'function getShopMessage\(\)\s*\{(.*?)\}'
    shop_match = re.search(shop_pattern, content, re.DOTALL)
    if shop_match:
        shop_body = shop_match.group(1)
        pools = re.findall(r'\[(.*?)\]', shop_body, re.DOTALL)
        for i, pool in enumerate(pools):
            messages = []
            for m in re.finditer(r'"([^"]*)"|\'([^\']*)\'', pool):
                messages.append(m.group(1) if m.group(1) is not None else m.group(2))
            name = f"ShopMessage Pool {i+1}"
            for msg in messages:
                clean = clean_html(msg)
                if len(clean) > desc_limit:
                    warnings.append(f"Long Text - {name}: \"{clean[:30]}...\" is {len(clean)} chars (limit {desc_limit})")

def parse_version_timestamp(content):
    match = re.search(r'var versionCode = "ver\. (\d{2}/\d{2}/\d{2,4} @ \d{2}:\d{2} [AP]M)"', content)
    if not match:
        return None
    ts_str = match.group(1)
    fmt = "%m/%d/%Y @ %I:%M %p" if len(ts_str.split('/')[2].split(' ')[0]) == 4 else "%m/%d/%y @ %I:%M %p"
    return datetime.strptime(ts_str, fmt)

def make_identifier(text):
    clean = re.sub(r'<[^>]+>', '', text or '')
    snippet = clean[:30].rstrip()
    return f'"{snippet}..."' if len(clean) > 30 else f'"{clean}"'

def check_length(text, limit, category, location, identifier, warnings):
    if not text:
        return 0
    n = display_len(text)
    if n > limit:
        warnings.append(f'Long Text - {category}: {location} - {identifier} is {n} chars (limit {limit})')
    return n

def check_average_outliers(lengths_data, category, warnings):
    if not lengths_data or AVG_MULTIPLIER <= 0:
        return

    actual_lengths = [l for l, _, _ in lengths_data if l > 0]
    if not actual_lengths:
        return

    avg = sum(actual_lengths) / len(actual_lengths)
    threshold = avg * AVG_MULTIPLIER

    # Don't warn for very short averages or if threshold is too low
    if threshold < 40:
        threshold = 40
    if avg < 10:
        threshold = max(threshold, 30)

    for length, location, identifier in lengths_data:
        if length > threshold and length > 30:
            warnings.append(f'Long Text - {category}: {location} - {identifier} is {length} chars (avg {avg:.0f}, limit {int(threshold)})')

def validate_csv(file_path, expected_columns, stat_indices, check_sequence=False):
    print(f"Validating {file_path}...")
    errors = []
    warnings = []

    name_lengths = []
    desc_lengths = []
    msg_lengths = []
    origin_name_lengths = []
    origin_desc_lengths = []

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        if not lines:
            return [f"File {file_path} is empty"], []

        header = lines[0].strip().split(';')
        if len(header) != expected_columns:
            errors.append(f"Header has {len(header)} columns, expected {expected_columns}")

        last_area = None
        last_area_start_line = None
        last_area_start_rid = None
        seen_areas = set()
        area_first_row = {}  # area -> (line_num, row_id)

        for i, line in enumerate(lines[1:], start=2):
            stripped_line = line.strip()
            if not stripped_line or stripped_line.startswith('//'):
                continue
            cols = stripped_line.split(';')
            if len(cols) != expected_columns:
                hint = f' [{cols[1].strip()} {cols[2].strip()}]' if len(cols) >= 3 else (f' [{cols[1].strip()}]' if len(cols) >= 2 else '')
                errors.append(f"Line {i}{hint}: Found {len(cols)} columns, expected {expected_columns}")
                continue

            # Build row identity for use in all error messages
            if expected_columns == 15:
                row_id = f'[{cols[1].strip()} {cols[2].strip()}]'
            elif expected_columns == 11:
                row_id = f'[{cols[1].strip()}]'
            else:
                row_id = ''

            # Emoji check
            emoji_idx = 1 if expected_columns == 15 else 0
            emoji_val = cols[emoji_idx].strip()
            if not emoji_val:
                errors.append(f"Line {i} {row_id}: Missing emoji")
            elif re.search(r'[a-zA-Z]', emoji_val):
                errors.append(f"Line {i} {row_id}: Emoji column contains unexpected characters: '{emoji_val}'")

            # Stat numeric check
            for idx in stat_indices:
                val = cols[idx].strip()
                if val:
                    try:
                        float(val.replace(',', '.'))
                    except ValueError:
                        col_name = header[idx] if idx < len(header) else idx
                        errors.append(f"Line {i} {row_id}: '{col_name}' ('{val}') is not a number")

            # Text length checks for encounters/story
            if expected_columns == 15:
                name = cols[2]
                etype = cols[3]
                desc = cols[12]
                msg = cols[13]

                loc = f"{file_path}:{i}"
                is_generator = etype.strip().startswith("Generator")

                n = check_length(name, TEXT_LIMITS['encounter_name'], 'Name', loc, row_id, warnings)
                name_lengths.append((n, loc, row_id))

                def check_html_lines(text, limit, category):
                    max_len = 0
                    for line in text.split('<br>'):
                        ln = check_length(line, limit, category, loc, row_id, warnings)
                        max_len = max(max_len, ln)
                    return max_len

                if not (is_generator and desc.strip() == "XXX"):
                    n = check_html_lines(desc, TEXT_LIMITS['encounter_desc'], 'Description')
                    desc_lengths.append((n, loc, row_id))

                if not (is_generator and msg.strip() == "XXX"):
                    n = check_html_lines(msg, TEXT_LIMITS['encounter_msg'], 'Message')
                    msg_lengths.append((n, loc, row_id))

                # desc must contain <br> (po/em and Generator XXX placeholders are exempt)
                if desc and '<br>' not in desc and 'po/em' not in desc and not (is_generator and desc.strip() == 'XXX'):
                    errors.append(f'Missing <br> - {loc} {row_id}: desc has no <br> tag')

            # Stat columns must not be empty; other empty fields are warnings
            MESSAGE_COL = 13
            stat_idx_set = set(stat_indices)
            for col_i, val in enumerate(cols):
                if col_i == MESSAGE_COL:
                    continue
                if val == '':
                    col_name = header[col_i] if col_i < len(header) else str(col_i)
                    if col_i in stat_idx_set:
                        errors.append(f'Empty Stat - {file_path}:{i} {row_id}: \'{col_name}\' stat column is empty')
                    else:
                        warnings.append(f'Empty Field - {file_path}:{i} {row_id}: \'{col_name}\' column is empty')

            # Text length checks for origins
            if expected_columns == 11:
                loc = f"{file_path}:{i}"
                n = check_length(cols[1], TEXT_LIMITS['origin_name'], 'Origin Name', loc, row_id, warnings)
                origin_name_lengths.append((n, loc, row_id))
                n = check_length(cols[9], TEXT_LIMITS['origin_desc'], 'Origin Description', loc, row_id, warnings)
                origin_desc_lengths.append((n, loc, row_id))

            # Sequence check for area
            if check_sequence:
                area = cols[0].strip()
                if area != last_area:
                    if area in seen_areas:
                        errors.append(f"Line {last_area_start_line} {last_area_start_rid}: Area '{last_area}' interrupts '{area}' block (previously seen at Line {area_first_row[area][0]}) — misplaced row or typo")
                    else:
                        seen_areas.add(area)
                        area_first_row[area] = (i, row_id)
                    last_area = area
                    last_area_start_line = i
                    last_area_start_rid = row_id

    check_average_outliers(name_lengths, 'Name', warnings)
    check_average_outliers(desc_lengths, 'Description', warnings)
    check_average_outliers(msg_lengths, 'Message', warnings)
    check_average_outliers(origin_name_lengths, 'Origin Name', warnings)
    check_average_outliers(origin_desc_lengths, 'Origin Description', warnings)

    return errors, warnings

def validate_js_files(js_dir):
    print(f"Validating JS files in {js_dir}...")
    warnings = []

    ach_desc_lengths = []
    ach_hint_lengths = []
    log_lengths = []
    btn_lengths = []
    enc_name_lengths = []
    enc_desc_lengths = []
    enc_msg_lengths = []

    ach_desc_re = re.compile(r'desc:\s*[\'"](.*?)[\'"]', re.IGNORECASE)
    ach_hint_re = re.compile(r'hint:\s*[\'"](.*?)[\'"]', re.IGNORECASE)
    log_action_re = re.compile(r'logAction\(\s*[\'"](.*?)[\'"]', re.IGNORECASE)
    log_player_action_re = re.compile(r'logPlayerAction\([^,]+,\s*[\'"](.*?)[\'"]', re.IGNORECASE)
    button_set_re = re.compile(r'setButton\([^,]+,\s*[\'"](.*?)[\'"]', re.IGNORECASE)
    button_inner_re = re.compile(r'\.innerHTML\s*=\s*[\'"](.*?)[\'"]', re.IGNORECASE)
    hc_name_re = re.compile(r'["\']name:(.*?)["\']', re.IGNORECASE)
    hc_desc_re = re.compile(r'["\']desc:(.*?)["\']', re.IGNORECASE)
    hc_msg_re = re.compile(r'["\']message:(.*?)["\']', re.IGNORECASE)

    for root, _, files in os.walk(js_dir):
        for file in files:
            if not file.endswith('.js'):
                continue

            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            def get_loc(match):
                line_no = content.count('\n', 0, match.start()) + 1
                return f"{file}:{line_no}"

            if 'achievements.js' in file:
                for m in ach_desc_re.finditer(content):
                    loc, idf = get_loc(m), make_identifier(m.group(1))
                    ach_desc_lengths.append((check_length(m.group(1), TEXT_LIMITS['achievement_desc'], 'Achievement Description', loc, idf, warnings), loc, idf))
                for m in ach_hint_re.finditer(content):
                    loc, idf = get_loc(m), make_identifier(m.group(1))
                    ach_hint_lengths.append((check_length(m.group(1), TEXT_LIMITS['achievement_hint'], 'Achievement Hint', loc, idf, warnings), loc, idf))

            for m in log_action_re.finditer(content):
                loc, idf = get_loc(m), make_identifier(m.group(1))
                log_lengths.append((check_length(m.group(1), TEXT_LIMITS['log_message'], 'Log Message', loc, idf, warnings), loc, idf))
            for m in log_player_action_re.finditer(content):
                loc, idf = get_loc(m), make_identifier(m.group(1))
                log_lengths.append((check_length(m.group(1), TEXT_LIMITS['log_message'], 'Log Message', loc, idf, warnings), loc, idf))

            for m in button_set_re.finditer(content):
                loc, idf = get_loc(m), make_identifier(m.group(1))
                btn_lengths.append((check_length(m.group(1), TEXT_LIMITS['button_text'], 'Button Text', loc, idf, warnings), loc, idf))
            for m in button_inner_re.finditer(content):
                if 'button' in m.group(0).lower() or 'btn' in m.group(0).lower() or 'js/ui-buttons.js' in file_path:
                    loc, idf = get_loc(m), make_identifier(m.group(1))
                    btn_lengths.append((check_length(m.group(1), TEXT_LIMITS['button_text'], 'Button Text', loc, idf, warnings), loc, idf))

            for m in hc_name_re.finditer(content):
                loc, idf = get_loc(m), make_identifier(m.group(1))
                enc_name_lengths.append((check_length(m.group(1), TEXT_LIMITS['encounter_name'], 'Name', loc, idf, warnings), loc, idf))
            for m in hc_desc_re.finditer(content):
                loc, idf = get_loc(m), make_identifier(m.group(1))
                enc_desc_lengths.append((check_length(m.group(1), TEXT_LIMITS['encounter_desc'], 'Description', loc, idf, warnings), loc, idf))
            for m in hc_msg_re.finditer(content):
                loc, idf = get_loc(m), make_identifier(m.group(1))
                enc_msg_lengths.append((check_length(m.group(1), TEXT_LIMITS['encounter_msg'], 'Message', loc, idf, warnings), loc, idf))

    check_average_outliers(ach_desc_lengths, 'Achievement Description', warnings)
    check_average_outliers(ach_hint_lengths, 'Achievement Hint', warnings)
    check_average_outliers(log_lengths, 'Log Message', warnings)
    check_average_outliers(btn_lengths, 'Button Text', warnings)
    check_average_outliers(enc_name_lengths, 'Name', warnings)
    check_average_outliers(enc_desc_lengths, 'Description', warnings)
    check_average_outliers(enc_msg_lengths, 'Message', warnings)

    return warnings

def _is_emoji(ch):
    cp = ord(ch)
    return (
        0x1F000 <= cp <= 0x1FFFF or
        0x2600  <= cp <= 0x27BF  or
        0x2300  <= cp <= 0x23FF  or
        0x1F900 <= cp <= 0x1FAFF or
        ch in '❤🟢💔🔵🧠⚔🍀🪙💰🟣'
    )

def check_emoji_period(js_dir):
    print(f"Checking for period-before-emoji in {js_dir}...")
    errors = []
    for path in sorted(glob.glob(os.path.join(js_dir, '*.js'))):
        with open(path, encoding='utf-8') as f:
            content = f.read()
        for m in re.finditer(r'"([^"\n]*)"|\'([^\'\n]*)\'', content):
            s = m.group(1) if m.group(1) is not None else m.group(2)
            if not s: continue
            rstripped = s.rstrip()
            if not rstripped or not _is_emoji(rstripped[-1]): continue
            i = len(rstripped) - 1
            while i >= 0 and (_is_emoji(rstripped[i]) or rstripped[i] in ' \t0123456789+-'):
                i -= 1
            if i >= 0 and rstripped[i] == '.':
                line_no = content.count('\n', 0, m.start()) + 1
                fname = os.path.basename(path)
                errors.append(f"Period before emoji: {fname}:{line_no}: \"{s.strip()}\"")
    return errors

VOID_ELEMENTS = {
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
}

def _strip_jekyll_front_matter(raw):
    if not raw.startswith('---'): return raw
    idx = raw.find('\n---', 3)
    if idx == -1: return raw
    fm_end = idx + 4
    return '\n' * raw[:fm_end].count('\n') + raw[fm_end:]

def _find_unclosed_brackets(content, file_path):
    errors = []
    cleaned = re.sub(r'<!--.*?-->', lambda m: ' ' * len(m.group(0)), content, flags=re.DOTALL)
    i = 0
    n = len(cleaned)
    while i < n:
        if cleaned[i] == '<' and i + 1 < n and (cleaned[i + 1].isalpha() or cleaned[i + 1] == '/'):
            k = i + 1
            found_gt = False
            while k < n:
                if cleaned[k] == '>':
                    found_gt = True
                    i = k + 1
                    break
                if cleaned[k] == '<': break
                k += 1
            if not found_gt:
                ln = content.count('\n', 0, i) + 1
                snippet = content[i:min(i + 50, n)].replace('\n', ' ')
                errors.append(f"HTML Tags - {file_path}:{ln}: unclosed angle bracket: \"{snippet}\"")
                i = k
                continue
        i += 1
    return errors

def validate_html_file(file_path):
    print(f"Validating HTML in {file_path}...")
    errors = []
    warnings = []
    with open(file_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    content = _strip_jekyll_front_matter(raw)
    def line_of(pos): return content.count('\n', 0, pos) + 1
    for m in re.finditer(r'style\s*=\s*"(.*?)"', content, re.DOTALL):
        val = m.group(1).strip()
        if val and not val.endswith(';'):
            short = val.replace('\n', ' ')
            short = ('...' + short[-57:]) if len(short) > 60 else short
            warnings.append(f"HTML Style - {file_path}:{line_of(m.start())}: style does not end with ';': \"{short}\"")
    seen_ids = {}
    for m in re.finditer(r'\bid\s*=\s*"([^"]+)"', content, re.IGNORECASE):
        id_val = m.group(1)
        ln = line_of(m.start())
        if id_val in seen_ids:
            errors.append(f"HTML IDs - {file_path}:{ln}: duplicate id=\"{id_val}\" (first at line {seen_ids[id_val]})")
        else: seen_ids[id_val] = ln
    errors.extend(_find_unclosed_brackets(content, file_path))
    tag_re = re.compile(r'<!--.*?-->|</(\w[\w:-]*)\s*>|<(\w[\w:-]*)([^>]*)>', re.DOTALL)
    stack = []
    for m in tag_re.finditer(content):
        ln = line_of(m.start())
        if m.group(1) is not None:
            tag = m.group(1).lower()
            if tag in VOID_ELEMENTS: continue
            if not stack: errors.append(f"HTML Tags - {file_path}:{ln}: unexpected </{tag}>")
            elif stack[-1][0] != tag: errors.append(f"HTML Tags - {file_path}:{ln}: </{tag}> does not match <{stack[-1][0]}> (line {stack[-1][1]})")
            else: stack.pop()
        elif m.group(2) is not None:
            tag = m.group(2).lower()
            if tag in VOID_ELEMENTS: continue
            if (m.group(3) or '').rstrip().endswith('/'): continue
            stack.append((tag, ln))
    for tag, ln in stack: errors.append(f"HTML Tags - {file_path}:{ln}: unclosed <{tag}>")
    return errors, warnings

def validate_html_in_js(js_dir):
    print(f"Validating HTML in JS files under {js_dir}...")
    warnings = []
    for root, _, files in os.walk(js_dir):
        for fname in sorted(files):
            if not fname.endswith('.js'): continue
            fpath = os.path.join(root, fname)
            with open(fpath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            for i, line in enumerate(lines, 1):
                if line.strip().startswith('//'): continue
                for m in re.finditer(r'style="([^"<>+]+)"(?!\s*"?\s*\+)', line):
                    val = m.group(1).strip()
                    if val and not val.endswith(';'):
                        warnings.append(f"HTML Style - {fname}:{i}: style does not end with ';': \"{val[-60:]}\"")
                for m in re.finditer(r'style=\\"([^\\"]+)\\"(?!\s*"?\s*\+)', line):
                    val = m.group(1).strip()
                    if val and not val.endswith(';'):
                        warnings.append(f"HTML Style - {fname}:{i}: style does not end with ';': \"{val[-60:]}\"")
    return warnings

def check_tutorial_skip_index(story_csv_path, data_loader_path, constants_path='js/constants.js'):
    errors = []
    dos_count = 0
    with open(story_csv_path, 'r', encoding='utf-8') as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith('//'): continue
            cols = stripped.split(';')
            if cols[0].strip() == 'Depths of Slumber': dos_count += 1
    # Prefer the named constant over literal call-site numbers
    skip_index = None
    if os.path.exists(constants_path):
        with open(constants_path, 'r', encoding='utf-8') as f:
            m = re.search(r'TUTORIAL_SKIP_INDEX\s*=\s*(\d+)', f.read())
            if m:
                skip_index = int(m.group(1))
    if skip_index is None:
        with open(data_loader_path, 'r', encoding='utf-8') as f:
            content = f.read()
        calls = [int(m.group(1)) for m in re.finditer(r'loadEncounter\((\d+)\)', content)]
        if not calls:
            errors.append(f"Tutorial Skip - TUTORIAL_SKIP_INDEX not found in {constants_path} and no literal loadEncounter(N) in {data_loader_path}")
            return errors
        skip_index = calls[0]
    if skip_index != dos_count:
        errors.append(f"Tutorial Skip - TUTORIAL_SKIP_INDEX={skip_index} but story.csv has {dos_count} Depths of Slumber rows")
    return errors

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('csv', 'html', 'js') else None
    all_errors = []
    all_warnings = []

    if mode in (None, 'csv'):
        if os.path.exists('data/encounters.csv'):
            errs, warns = validate_csv('data/encounters.csv', 15, range(4, 11), check_sequence=True)
            all_errors.extend(errs)
            all_warnings.extend(warns)
        if os.path.exists('data/story.csv'):
            errs, warns = validate_csv('data/story.csv', 15, range(4, 11))
            all_errors.extend(errs)
            all_warnings.extend(warns)
        if os.path.exists('data/story.csv') and os.path.exists('js/data-loader.js'):
            all_errors.extend(check_tutorial_skip_index('data/story.csv', 'js/data-loader.js'))
        if os.path.exists('data/origins.csv'):
            errs, _ = validate_csv('data/origins.csv', 11, range(2, 9))
            all_errors.extend(errs)
        
        validate_achievement_origins(all_warnings, all_errors)
        validate_origin_stats(all_warnings, all_errors)
        validate_encounter_stats(all_warnings, all_errors)
        
        if os.path.exists('js'):
            all_warnings.extend(validate_js_files('js'))
            validate_string_generator_lengths(all_warnings)

    if mode in (None, 'js'):
        if os.path.exists('js'):
            all_errors.extend(check_emoji_period('js'))

    if mode in (None, 'html'):
        if os.path.exists('index.md'):
            errs, warns = validate_html_file('index.md')
            all_errors.extend(errs)
            all_warnings.extend(warns)
        if os.path.exists('js'):
            all_warnings.extend(validate_html_in_js('js'))

    if mode is None and len(sys.argv) > 2:
        cpath, bpath = sys.argv[1], sys.argv[2]
        if os.path.exists(cpath) and os.path.exists(bpath):
            with open(cpath, 'r') as f: cts = parse_version_timestamp(f.read())
            with open(bpath, 'r') as f: bts = parse_version_timestamp(f.read())
            if not cts: all_errors.append(f"Could not parse version from {cpath}")
            elif bts and cts <= bts: all_errors.append("Version check failed: Current version not newer than base.")

    if all_warnings:
        print("\nWarnings:")
        for warn in all_warnings: print(f"  {warn}")
    if all_errors:
        print("\nErrors:")
        for err in all_errors: print(f"  {err}")
        sys.exit(1)
    else:
        print("\nAll checks passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()
