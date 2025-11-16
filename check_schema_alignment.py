#!/usr/bin/env python3
"""
Script to check for old field references that need to be updated for normalized schema
"""
import os
import re
from pathlib import Path

# Old field patterns to search for
OLD_PATTERNS = {
    'car.currency (not car.currency_id or car.currency_rel)': r'\bcar\.currency\b(?!(_id|_rel))',
    'car.exterior_color': r'\bcar\.exterior_color\b',
    'car.negotiable (should be car.price_negotiable)': r'\bcar\.negotiable\b(?!(_))',
    'car.condition_rating (should be car.car_condition)': r'\bcar\.condition_rating\b',
    '"currency": car.currency': r'["\']currency["\']\s*:\s*car\.currency\b(?!(_id|_rel))',
    '"exterior_color": car.exterior_color': r'["\']exterior_color["\']\s*:\s*car\.exterior',
    '"negotiable": car.negotiable': r'["\']negotiable["\']\s*:\s*car\.negotiable\b',
    '"condition_rating": car.condition_rating': r'["\']condition_rating["\']\s*:\s*car\.condition',
}

def check_file(filepath):
    """Check a single file for old patterns"""
    issues = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for line_num, line in enumerate(lines, 1):
            for desc, pattern in OLD_PATTERNS.items():
                if re.search(pattern, line):
                    issues.append({
                        'line': line_num,
                        'content': line.strip()[:120],
                        'issue': desc
                    })
    except Exception as e:
        pass
        
    return issues

def main():
    print("="*80)
    print("SCHEMA ALIGNMENT CHECKER")
    print("="*80)
    print("\nSearching for old field references that need updating...\n")
    
    base_dir = Path(__file__).parent
    all_issues = {}
    
    # Check server Python files
    for py_file in base_dir.glob('server/**/*.py'):
        if '__pycache__' in str(py_file) or 'venv' in str(py_file):
            continue
        if py_file.name.startswith('test_') or py_file.name.startswith('fix_'):
            continue
            
        issues = check_file(py_file)
        if issues:
            rel_path = py_file.relative_to(base_dir)
            all_issues[str(rel_path)] = issues
    
    # Check client TypeScript files
    for ts_file in list(base_dir.glob('client/**/*.ts')) + list(base_dir.glob('client/**/*.tsx')):
        if 'node_modules' in str(ts_file):
            continue
            
        issues = check_file(ts_file)
        if issues:
            rel_path = ts_file.relative_to(base_dir)
            all_issues[str(rel_path)] = issues
    
    # Report results
    if all_issues:
        print(f"❌ FOUND {sum(len(v) for v in all_issues.values())} ISSUES in {len(all_issues)} files:\n")
        for filepath, issues in sorted(all_issues.items()):
            print(f"\n📄 {filepath}")
            for issue in issues:
                print(f"   Line {issue['line']}: {issue['issue']}")
                print(f"   >>> {issue['content']}")
        print("\n" + "="*80)
        print("ACTION REQUIRED: Pull latest changes from git or fix these issues manually")
        print("="*80)
        return 1
    else:
        print("✅ NO ISSUES FOUND - All field references are up to date!")
        print("\nYour codebase is aligned with normalized schema v4.0")
        return 0

if __name__ == '__main__':
    exit(main())
