package com.bankapp.xml;

import jakarta.xml.bind.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@XmlRootElement(name = "transactions")
@XmlAccessorType(XmlAccessType.FIELD)
public class TransactionListXml {

    @XmlElement(name = "transaction")
    private List<TransactionXml> transactions;

    @XmlAttribute(name = "count")
    private Integer count;

    @XmlAttribute(name = "generatedDate")
    private String generatedDate;
}
