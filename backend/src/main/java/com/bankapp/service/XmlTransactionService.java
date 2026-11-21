package com.bankapp.service;

import com.bankapp.model.Transaction;
import com.bankapp.xml.TransactionListXml;
import com.bankapp.xml.TransactionXml;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class XmlTransactionService {

    @Value("${xml.storage.path}")
    private String xmlStoragePath;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter FILE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    // Convert Transaction entity to TransactionXml
    private TransactionXml convertToXml(Transaction transaction) {
        TransactionXml xml = new TransactionXml();
        xml.setTransactionId(transaction.getTransactionId());
        xml.setTransactionType(transaction.getTransactionType().name());
        xml.setAmount(transaction.getAmount());
        xml.setFromAccountNumber(transaction.getFromAccount() != null ? 
                transaction.getFromAccount().getAccountNumber() : null);
        xml.setToAccountNumber(transaction.getToAccount() != null ? 
                transaction.getToAccount().getAccountNumber() : null);
        xml.setDescription(transaction.getDescription());
        xml.setStatus(transaction.getStatus().name());
        xml.setTransactionDate(transaction.getTransactionDate().format(DATE_FORMATTER));
        
        // Get user info from from account
        if (transaction.getFromAccount() != null) {
            xml.setUserId(transaction.getFromAccount().getUser().getId());
            xml.setUsername(transaction.getFromAccount().getUser().getUsername());
        }
        
        return xml;
    }

    // Save single transaction to XML file
    public void saveTransaction(Transaction transaction) {
        try {
            // Create storage directory if it doesn't exist
            ensureDirectoryExists();

            // Create file name based on date and transaction ID
            String fileName = generateFileName(transaction);
            File file = new File(xmlStoragePath + fileName);

            // Create JAXB context and marshaller
            JAXBContext context = JAXBContext.newInstance(TransactionXml.class);
            Marshaller marshaller = context.createMarshaller();
            marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
            marshaller.setProperty(Marshaller.JAXB_ENCODING, "UTF-8");

            // Convert and save
            TransactionXml xmlTransaction = convertToXml(transaction);
            marshaller.marshal(xmlTransaction, file);

            System.out.println("Transaction saved to XML: " + file.getAbsolutePath());

        } catch (JAXBException | IOException e) {
            System.err.println("Error saving transaction to XML: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Save multiple transactions to a single XML file
    public void saveTransactionList(List<Transaction> transactions, String fileName) {
        try {
            ensureDirectoryExists();

            File file = new File(xmlStoragePath + fileName);

            // Convert all transactions
            List<TransactionXml> xmlTransactions = transactions.stream()
                    .map(this::convertToXml)
                    .collect(Collectors.toList());

            // Create wrapper with metadata
            TransactionListXml listXml = new TransactionListXml();
            listXml.setTransactions(xmlTransactions);
            listXml.setCount(xmlTransactions.size());
            listXml.setGeneratedDate(LocalDateTime.now().format(DATE_FORMATTER));

            // Create JAXB context and marshaller
            JAXBContext context = JAXBContext.newInstance(TransactionListXml.class);
            Marshaller marshaller = context.createMarshaller();
            marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);
            marshaller.setProperty(Marshaller.JAXB_ENCODING, "UTF-8");

            // Save
            marshaller.marshal(listXml, file);

            System.out.println("Transaction list saved to XML: " + file.getAbsolutePath());

        } catch (JAXBException | IOException e) {
            System.err.println("Error saving transaction list to XML: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Read transaction from XML file
    public TransactionXml readTransaction(String fileName) {
        try {
            File file = new File(xmlStoragePath + fileName);
            
            if (!file.exists()) {
                throw new RuntimeException("XML file not found: " + fileName);
            }

            JAXBContext context = JAXBContext.newInstance(TransactionXml.class);
            Unmarshaller unmarshaller = context.createUnmarshaller();

            return (TransactionXml) unmarshaller.unmarshal(file);

        } catch (JAXBException e) {
            System.err.println("Error reading transaction from XML: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    // Read transaction list from XML file
    public TransactionListXml readTransactionList(String fileName) {
        try {
            File file = new File(xmlStoragePath + fileName);
            
            if (!file.exists()) {
                throw new RuntimeException("XML file not found: " + fileName);
            }

            JAXBContext context = JAXBContext.newInstance(TransactionListXml.class);
            Unmarshaller unmarshaller = context.createUnmarshaller();

            return (TransactionListXml) unmarshaller.unmarshal(file);

        } catch (JAXBException e) {
            System.err.println("Error reading transaction list from XML: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    // List all XML files in storage directory
    public List<String> listXmlFiles() {
        try {
            Path dir = Paths.get(xmlStoragePath);
            
            if (!Files.exists(dir)) {
                return new ArrayList<>();
            }

            return Files.list(dir)
                    .filter(path -> path.toString().endsWith(".xml"))
                    .map(path -> path.getFileName().toString())
                    .collect(Collectors.toList());

        } catch (IOException e) {
            System.err.println("Error listing XML files: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    // Helper: Generate file name
    private String generateFileName(Transaction transaction) {
        String date = transaction.getTransactionDate().format(FILE_FORMATTER);
        return "transaction_" + date + "_" + transaction.getTransactionId() + ".xml";
    }

    // Helper: Ensure directory exists
    private void ensureDirectoryExists() throws IOException {
        Path path = Paths.get(xmlStoragePath);
        if (!Files.exists(path)) {
            Files.createDirectories(path);
            System.out.println("Created XML storage directory: " + path.toAbsolutePath());
        }
    }
}
