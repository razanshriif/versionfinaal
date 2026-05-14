import json
import re

def replace_single_quotes_with_double_quotes(input_path, output_path):
    with open(input_path, 'r') as file:
        content = file.read()

    # Replace single quotes with double quotes
    content = re.sub(r"(?<!\\)'", '"', content)  # Replace unescaped single quotes
 # Replace true and false with "true" and "false"
    content = re.sub(r'\bTrue\b', '"true"', content)
    content = re.sub(r'\bFalse\b', '"false"', content)
    content = re.sub(r'\bNone\b', '"null"', content)
       # Convert datetime.date(YYYY, M, D) to "D/M/YYYY"
    def replace_date(match):
        year = match.group(1)
        month = match.group(2)
        day = match.group(3)
        return f'"{int(day)}/{int(month)}/{year}"'

    content = re.sub(r'datetime\.date\((\d{4}), (\d+), (\d+)\)', replace_date, content)

  # Convert Decimal("value") to integer value
    def replace_decimals(text):
        pattern = r'Decimal\("([\d\.]+)"\)'
        def repl(match):
            return match.group(1)
        return re.sub(pattern, repl, text)

    # Appliquer la conversion Decimal après les autres transformations
    content = replace_decimals(content)

  
  
   # Supprimer le premier '[' et le dernier ']'
    if content.startswith('["'):
        content = content[2:]
    if content.endswith('"]'):
        content = content[:-2]
  




    content = re.sub(r'(\[|\}\,)', r'\1\n', content)

    # Write the modified content to a new file
    with open(output_path, 'w') as file:
        file.write(content)

input_path = r"\\172.18.3.56\requetes_edge_5555\mesvoyes.json"
output_path = r"C:\Users\admin.test\Desktop\AppDivers\mesvoyes_converted.json"

replace_single_quotes_with_double_quotes(input_path, output_path)
print(f"Conversion terminée. Le fichier converti est disponible à {output_path}.")
