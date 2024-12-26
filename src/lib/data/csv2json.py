import csv
import json
from pathlib import Path
from datetime import datetime

def convert_csv_to_json(csv_path: str, country_id: str, country_name: str) -> None:
    """Convert a CPI CSV file to our application's JSON format."""
    data_points = []
    
    with open(csv_path, 'r') as csvfile:
        # Skip header
        next(csvfile)
        
        csvreader = csv.reader(csvfile)
        for row in csvreader:
            date_str, value = row
            # Parse date and value
            date = datetime.strptime(date_str, '%Y-%m-%d')
            value = float(value)
            
            data_points.append({
                "date": date.isoformat(),
                "value": value
            })
    
    # Create the final structure
    output = {
        "id": country_id,
        "name": country_name,
        "data": data_points
    }
    
    # Generate output filename
    output_path = Path(csv_path).with_suffix('.json')
    
    # Write JSON file
    with open(output_path, 'w') as jsonfile:
        json.dump(output, jsonfile, indent=2)

def main():
    # Convert USA data
    convert_csv_to_json(
        csv_path='./usa.csv',
        country_id='usa',
        country_name='United States'
    )
    
    # Add more countries here as needed
    # Example:
    # convert_csv_to_json(
    #     csv_path='src/lib/data/canada.csv',
    #     country_id='can',
    #     country_name='Canada'
    # )

if __name__ == '__main__':
    main()
