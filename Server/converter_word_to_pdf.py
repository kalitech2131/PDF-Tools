import sys
import os
from docx2pdf import convert

def convert_docx_to_pdf(docx_path, pdf_path):
    try:
        if not os.path.exists(docx_path):
            print(f"Error: Input file '{docx_path}' not found.")
            return False

        convert(docx_path, pdf_path)

        if not os.path.exists(pdf_path):
            print("Error: Output file not created.")
            return False

        print(f"Successfully converted {docx_path} to {pdf_path}")
        return True
    except Exception as e:
        print(f"Conversion error: {str(e)}")
        return False


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python converter_word_to_pdf.py <input_docx_path> <output_pdf_path>")
        sys.exit(1)

    input_docx = sys.argv[1]
    output_pdf = sys.argv[2]

    success = convert_docx_to_pdf(input_docx, output_pdf)
    sys.exit(0 if success else 1)


















