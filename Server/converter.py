# # server/converter.py
# from pdf2docx import Converter
# import sys
# import os

# def convert_pdf_to_docx(pdf_path, docx_path):
#     """
#     Converts a specified PDF file to a DOCX file.
#     """
#     try:
#         # Initialize the Converter object
#         cv = Converter(pdf_path)
#         # Perform the conversion
#         cv.convert(docx_path, start=0, end=None)
#         # Close the converter object
#         cv.close()
#         print(f"Successfully converted {pdf_path} to {docx_path}")
#         return True
#     except Exception as e:
#         print(f"An error occurred during conversion: {e}")
#         return False

# if __name__ == "__main__":
#     # The script expects two command-line arguments:
#     # 1. The input PDF file path
#     # 2. The output DOCX file path
#     if len(sys.argv) != 3:
#         print("Usage: python converter.py <input_pdf_path> <output_docx_path>")
#         sys.exit(1)

#     input_pdf = sys.argv[1]
#     output_docx = sys.argv[2]

#     if not os.path.exists(input_pdf):
#         print(f"Error: The file '{input_pdf}' was not found.")
#         sys.exit(1)
        
#     convert_pdf_to_docx(input_pdf, output_docx)





















from pdf2docx import Converter
import sys
import os

def convert_pdf_to_docx(pdf_path, docx_path):
    """
    Converts a PDF file to DOCX format.
    Returns True if successful, False otherwise.
    """
    try:
        # Check if input file exists
        if not os.path.exists(pdf_path):
            print(f"Error: Input file '{pdf_path}' not found.")
            return False

        # Initialize converter
        cv = Converter(pdf_path)
        
        # Perform conversion with progress tracking
        cv.convert(docx_path, start=0, end=None)
        cv.close()
        
        # Verify output file was created
        if not os.path.exists(docx_path):
            print("Error: Output file was not created.")
            return False
            
        print(f"Successfully converted {pdf_path} to {docx_path}")
        return True
        
    except Exception as e:
        print(f"Conversion error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python converter.py <input_pdf_path> <output_docx_path>")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]

    success = convert_pdf_to_docx(input_pdf, output_docx)
    sys.exit(0 if success else 1)