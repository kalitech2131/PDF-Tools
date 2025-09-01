# server/remove_password.py
import sys
import os
from pypdf import PdfReader, PdfWriter

def remove_password_from_pdf(input_path, output_path, password):
    """
    Reads an encrypted PDF, decrypts it with a password, and saves it.
    """
    try:
        reader = PdfReader(input_path)

        # Check if the PDF is actually encrypted
        if reader.is_encrypted:
            # Attempt to decrypt with the provided password
            if reader.decrypt(password) == 0:
                # 0 means decryption failed
                print("Error: Incorrect password provided.")
                return False
        
        writer = PdfWriter()

        # Add all pages from the original PDF to the new one
        for page in reader.pages:
            writer.add_page(page)

        # Save the new, decrypted PDF
        with open(output_path, "wb") as f:
            writer.write(f)
        
        print(f"Successfully removed password from {input_path}")
        return True
    except Exception as e:
        print(f"An error occurred while removing the password: {e}")
        return False

if __name__ == "__main__":
    # Expects three command-line arguments: input_path, output_path, password
    if len(sys.argv) != 4:
        print("Usage: python remove_password.py <input_pdf_path> <output_pdf_path> <password>")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    password = sys.argv[3]

    if not os.path.exists(input_pdf):
        print(f"Error: The file '{input_pdf}' was not found.")
        sys.exit(1)
        
    remove_password_from_pdf(input_pdf, output_pdf, password)