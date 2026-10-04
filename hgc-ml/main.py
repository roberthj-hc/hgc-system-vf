"""Reproducible CLI; no training on an API request or server startup."""
import argparse
import subprocess

from core.settings import ROOT


def build():
    # Explicit exclusion protects the entire Kimball layer, including descendants.
    subprocess.run(['dbt','build','--project-dir',str(ROOT/'dbt'),'--profiles-dir',str(ROOT/'dbt'),
        '--target-path',str(ROOT/'dbt/target-system'),'--log-path',str(ROOT/'dbt/logs-system'),
        '--select','+tag:system','--exclude','path:models/marts','--indirect-selection','cautious'],check=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['build','sync','train','refresh'])
    command=parser.parse_args().command
    if command in ('build','refresh'):
        build()
    if command in ('sync','refresh'):
        from data.sync import sync
        sync()
    if command in ('train','refresh'):
        from core.pipeline import train_all
        train_all()


if __name__=='__main__':
    main()
