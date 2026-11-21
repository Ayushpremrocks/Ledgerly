package com.bankapp.xml;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@XmlRootElement(name = "transaction")
@XmlAccessorType(XmlAccessType.FIELD)
public class TransactionXml {

    @XmlElement(name = "transactionId")
    private String transactionId;

    @XmlElement(name = "transactionType")
    private String transactionType;

    @XmlElement(name = "amount")
    private BigDecimal amount;

    @XmlElement(name = "fromAccountNumber")
    private String fromAccountNumber;

    @XmlElement(name = "toAccountNumber")
    private String toAccountNumber;

    @XmlElement(name = "description")
    private String description;

    @XmlElement(name = "status")
    private String status;

    @XmlElement(name = "transactionDate")
    private String transactionDate;

    @XmlElement(name = "userId")
    private Long userId;

    @XmlElement(name = "username")
    private String username;
}
